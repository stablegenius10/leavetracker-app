// Function to display leave history in the table
function displayLeaveHistory(leaveHistory) {
  const leaveHistoryTableBody = document.querySelector(
    "#leaveHistoryTableBody"
  );
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
}

// Function to update the approval status of a leave entry
async function updateApprovalStatus(id, approvalStatus) {
  try {
    const response = await fetch(
      `http://localhost:5555/update-approval-status/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvalStatus }),
      }
    );
    const data = await response.json();
  } catch (error) {
    console.error("Error updating approval status:", error);
  }
}

// Function to submit approval status changes
async function submitApprovalStatusChanges() {
  try {
    // Fetch all dropdowns with approval status changes
    const approvalDropdowns = document.querySelectorAll(
      ".approval-status-dropdown"
    );
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
  // Event listener for calculating leave duration
  var startDateInput = document.getElementById("startDate");
  var endDateInput = document.getElementById("endDate");
  var leaveDurationInput = document.getElementById("leaveDuration");

  startDateInput.addEventListener("change", function () {
    endDateInput.min = startDateInput.value;
    calculateDuration();
  });
  endDateInput.addEventListener("change", calculateDuration);

  // Fetch leave history data from the database
  await fetchLeaveHistory();

  // Bind the clearForm function to the clear button click event
  var clearButton = document.querySelector(".clear-button");
  clearButton.addEventListener("click", clearForm);

  // Event listener for leave type filter dropdown
  var leaveTypeFilter = document.getElementById("leaveTypeFilter");
  leaveTypeFilter.addEventListener("change", function () {
    var selectedLeaveType = leaveTypeFilter.value;
    filterLeaveHistory(selectedLeaveType);
  });

  var leaveForm = document.getElementById("leaveForm");
  leaveForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get form data
    var formData = {};
    var formInputs = document.querySelectorAll(
      "#leaveForm input, #leaveForm select"
    );
    formInputs.forEach(function (input) {
      formData[input.name] = input.value;
    });

    try {
      // Send form data to server
      const response = await fetch("http://localhost:5555/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Reload page after successful submission
        location.reload();
        alert("Form submitted successfully");
      } else {
        // Handle error response from server
        alert("Failed to submit form. Please try again.");
      }
    } catch (error) {
      // Handle network errors
      console.error("Error:", error);
      alert("An error occurred while submitting the form");
    }
  });

  // Event listener for the submit button
  const submitButton = document.getElementById("submitLeaveHistory");
  submitButton.addEventListener("click", submitApprovalStatusChanges);
});

// Function to clear the form
function clearForm() {
  // Select all input fields in the leave form
  var formInputs = document.querySelectorAll(
    "#leaveFormContent input[type=text], #leaveFormContent input[type=date], #leaveFormContent select"
  );

  // Loop through each input field and set its value to an empty string
  formInputs.forEach(function (input) {
    input.value = "";
  });

  // Reset the default approval status to "Pending"
  document.querySelector("#leaveFormContent input[name=approvalStatus]").value =
    "Pending";
}


// Function to calculate leave duration
function calculateDuration() {
  var startDate = new Date(document.getElementById("startDate").value);
  var endDate = new Date(document.getElementById("endDate").value);

  // Check if both start date and end date are valid
  if (
    !isNaN(startDate.getTime()) &&
    !isNaN(endDate.getTime()) &&
    endDate >= startDate
  ) {
    var timeDifference = endDate.getTime() - startDate.getTime();
    var daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    document.getElementById("leaveDuration").value = daysDifference + " days";
  } else {
    // If either start date or end date is invalid or end date is before start date, set leave duration to empty
    document.getElementById("leaveDuration").value = "";
  }
}

// Function to fetch leave history data from the database
async function fetchLeaveHistory() {
  try {
    const response = await fetch("http://localhost:5555/leave-history");
    const leaveHistory = await response.json();
    displayLeaveHistory(leaveHistory.reverse()); // Reverse the order of entries
  } catch (error) {
    console.error("Error fetching leave history:", error);
  }
}

// Function to filter leave history based on leave type
function filterLeaveHistory(selectedLeaveType) {
  var rows = document.querySelectorAll("#leaveHistoryTableBody tr");
  rows.forEach(function (row) {
    var leaveTypeCell = row.querySelector("td:nth-child(2)"); // Assuming leave type is in the second column
    var leaveType = leaveTypeCell.textContent.trim();
    if (selectedLeaveType === "" || leaveType === selectedLeaveType) {
      row.style.display = ""; // Show the row
    } else {
      row.style.display = "none"; // Hide the row
    }
  });
}

// Function to open tabs
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;

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
