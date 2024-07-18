// Function to display leave history in the table
function displayLeaveHistory(leaveHistory) {
  const leaveHistoryTableBody = document.querySelector("#leaveHistoryTableBody");
  leaveHistoryTableBody.innerHTML = ""; // Clear existing rows

  leaveHistory.forEach((entry) => {
      const row = document.createElement("tr");
      // Format dates and remove time
      const startDate = new Date(entry.startDate).toLocaleDateString("en-GB");
      const endDate = new Date(entry.endDate).toLocaleDateString("en-GB");
      row.innerHTML = `
          <td>${entry.employeeName}</td>
          <td>${entry.leaveType}</td>
          <td>${startDate}</td>
          <td>${endDate}</td>
          <td>${entry.leaveDuration}</td>
          <td>
              <select class="approval-status-dropdown" data-entry-id="${entry._id}">
                  <option value="Pending" ${entry.approvalStatus === "Pending" ? "selected" : ""}>Pending</option>
                  <option value="Approved" ${entry.approvalStatus === "Approved" ? "selected" : ""}>Approved</option>
                  <option value="Rejected" ${entry.approvalStatus === "Rejected" ? "selected" : ""}>Rejected</option>
              </select>
          </td>
          <td>${entry.comments || ""}</td>
      `;
      leaveHistoryTableBody.appendChild(row);
  });

  // Add event listener to each dropdown menu for approval status
  const approvalStatusDropdowns = document.querySelectorAll(".approval-status-dropdown");
  approvalStatusDropdowns.forEach((dropdown) => {
      dropdown.addEventListener("change", async function () {
          const entryId = this.getAttribute("data-entry-id");
          const newStatus = this.value;
          await updateApprovalStatus(entryId, newStatus);
      });
  });
}

// Function to update the approval status of a leave entry
async function updateApprovalStatus(id, approvalStatus) {
  try {
      const response = await fetch(`https://leavetrackerserver.onrender.com/api/update-approval-status/${id}`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ approvalStatus }),
      });
      const data = await response.json();
  } catch (error) {
      console.error("Error updating approval status:", error);
  }
}

// Function to submit approval status changes
async function submitApprovalStatusChanges() {
  try {
      // Fetch all dropdowns with approval status changes
      const approvalDropdowns = document.querySelectorAll(".approval-status-dropdown");
      // Create an array to store promises for all status update requests
      const updateRequests = [];

      // Iterate over each dropdown
      approvalDropdowns.forEach(async (dropdown) => {
          const entryId = dropdown.getAttribute("data-entry-id");
          const newStatus = dropdown.value;
          // Create a promise for each status update request
          const requestPromise = await updateApprovalStatus(entryId, newStatus);
          updateRequests.push(requestPromise);
      });

      // Wait for all status update requests to complete
      await Promise.all(updateRequests);

      // Once all requests are completed, fetch updated leave history
      fetchLeaveHistory();
  } catch (error) {
      console.error("Error submitting approval status changes:", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Fetch leave history data from the database
  await fetchLeaveHistory();

  // Event listener for the submit button
  const submitButton = document.getElementById("submitLeaveHistory");
  submitButton.addEventListener("click", submitApprovalStatusChanges);

  // Event listener for the employee name filter dropdown
  const employeeNameFilter = document.getElementById("employeeNameFilter");
  employeeNameFilter.addEventListener("change", function () {
      filterLeaveHistoryByEmployee();
  });

  // Event listener for calculating leave duration
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  startDateInput.addEventListener("change", function () {
      endDateInput.min = startDateInput.value;
      calculateDuration();
  });
  endDateInput.addEventListener("change", calculateDuration);

  // Bind the clearForm function to the clear button click event
  const clearButton = document.querySelector(".clear-button");
  clearButton.addEventListener("click", clearForm);

  // Initialize leave history filter by employee name
  filterLeaveHistoryByEmployee();
});

// Function to clear the form
function clearForm() {
  // Select all input fields in the leave form
  const formInputs = document.querySelectorAll("#leaveFormContent input[type=text], #leaveFormContent input[type=date], #leaveFormContent select");

  // Loop through each input field and set its value to an empty string
  formInputs.forEach((input) => {
      input.value = "";
  });

  // Reset the default approval status to "Pending"
  document.querySelector("#leaveFormContent select[name=approvalStatus]").value = "Pending";

  // Recalculate leave duration if necessary
  calculateDuration();
}

// Function to calculate leave duration
function calculateDuration() {
  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);

  // Check if both start date and end date are valid
  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
      const timeDifference = endDate.getTime() - startDate.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
      document.getElementById("leaveDuration").value = (daysDifference + 1) + " days";
  } else {
      // If either start date or end date is invalid or end date is before start date, set leave duration to empty
      document.getElementById("leaveDuration").value = "";
  }
}

// Function to fetch leave history data from the database based on filters
async function fetchLeaveHistory() {
  try {
      const response = await fetch("https://leavetrackerserver.onrender.com/api/leave-history");
      const leaveHistory = await response.json();

      // Populate employee name filter dropdown
      populateEmployeeNameFilter(leaveHistory);

      // Display leave history based on current filters
      displayLeaveHistory(leaveHistory);

  } catch (error) {
      console.error("Error fetching leave history:", error);
  }
}

// Function to populate employee name filter dropdown
function populateEmployeeNameFilter(leaveHistory) {
  const employeeNameFilter = document.getElementById("employeeNameFilter");
  const uniqueEmployeeNames = [...new Set(leaveHistory.map(entry => entry.employeeName))];
  employeeNameFilter.innerHTML = '<option value="">All</option>'; // Clear existing options

  uniqueEmployeeNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      employeeNameFilter.appendChild(option);
  });
}

// Function to filter leave history by employee name
function filterLeaveHistoryByEmployee() {
  const selectedEmployeeName = document.getElementById("employeeNameFilter").value;
  const rows = document.querySelectorAll("#leaveHistoryTableBody tr");

  rows.forEach(row => {
      const employeeNameCell = row.querySelector("td:nth-child(1)"); // Assuming employee name is in the first column
      const employeeName = employeeNameCell.textContent.trim();

      if (selectedEmployeeName === "" || employeeName === selectedEmployeeName) {
          row.style.display = ""; // Show the row
      } else {
          row.style.display = "none"; // Hide the row
      }
  });
}

// Function to open tabs
function openTab(evt, tabName) {
  let i, tabcontent, tablinks;

  // Hide all tab content
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }

  // Deactivate all tab links
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the specific tab content
  document.getElementById(tabName).style.display = "block";

  // Activate the specific tab link
  evt.currentTarget.className += " active";
}
// Function to display leave history in the table (latest entries first)
function displayLeaveHistory(leaveHistory) {
  const leaveHistoryTableBody = document.querySelector(
    "#leaveHistoryTableBody"
  );
  leaveHistoryTableBody.innerHTML = ""; // Clear existing rows

  // Reverse the leave history array to display latest entries first
  leaveHistory.reverse().forEach((entry) => {
    const row = document.createElement("tr");
    // Format dates and remove time
    const startDate = new Date(entry.startDate).toLocaleDateString("en-GB");
    const endDate = new Date(entry.endDate).toLocaleDateString("en-GB");
    row.innerHTML = `
            <td>${entry.employeeName}</td>
            <td>${entry.leaveType}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${entry.leaveDuration}</td>
            <td>
                <select class="approval-status-dropdown" data-entry-id="${
                  entry._id
                }">
                    <option value="Pending" ${
                      entry.approvalStatus === "Pending" ? "selected" : ""
                    }>Pending</option>
                    <option value="Approved" ${
                      entry.approvalStatus === "Approved" ? "selected" : ""
                    }>Approved</option>
                    <option value="Rejected" ${
                      entry.approvalStatus === "Rejected" ? "selected" : ""
                    }>Rejected</option>
                </select>
            </td>
            <td>${entry.comments || ""}</td>
            <td><button class="delete-button" data-entry-id="${entry._id}">Delete</button></td>
        `;
    leaveHistoryTableBody.appendChild(row);
  });

  // Add event listener to each dropdown menu for approval status
  const approvalStatusDropdowns = document.querySelectorAll(
    ".approval-status-dropdown"
  );
  approvalStatusDropdowns.forEach((dropdown) => {
    dropdown.addEventListener("change", async function () {
      const entryId = this.getAttribute("data-entry-id");
      const newStatus = this.value;
      await updateApprovalStatus(entryId, newStatus);
    });
  });

  // Add event listener to each delete button
  const deleteButtons = document.querySelectorAll(".delete-button");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const entryId = this.getAttribute("data-entry-id");
      deleteLeaveEntry(entryId);
    });
  });
}

// Function to delete a leave entry
async function deleteLeaveEntry(id) {
  try {
    const response = await fetch(
      `https://leavetrackerserver.onrender.com/api/delete-leave-entry/${id}`,
      {
        method: "DELETE",
      }
    );
    const data = await response.json();
    // Refresh leave history after deletion
    fetchLeaveHistory();
    alert("Leave entry deleted successfully!");
  } catch (error) {
    console.error("Error deleting leave entry:", error);
    alert("Failed to delete leave entry. Please try again.");
  }
}

// Event listener for the submit button
const submitButton = document.getElementById("submitLeaveHistory");
submitButton.addEventListener("click", submitApprovalStatusChanges);
