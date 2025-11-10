/*
  Clear Dates for OmniFocus 4
  JavaScript version of the Clear Dates AppleScript

  Clears the start (defer) and due dates of selected items.

  Original AppleScript by Dan Byler
  JavaScript conversion for OmniFocus 4
*/

(() => {
  const action = new PlugIn.Action(function(selection, sender) {
    // Get selected tasks and projects
    const selectedItems = selection.databaseObjects.filter(obj =>
      obj instanceof Task || obj instanceof Project
    );

    if (selectedItems.length === 0) {
      new Alert("No valid task(s) selected", "Please select one or more tasks or projects.").show();
      return;
    }

    // Clear dates for each selected item
    let successCount = 0;
    selectedItems.forEach(item => {
      try {
	// Clear defer (start) date
	item.deferDate = null;
	// Clear due date
	item.dueDate = null;
	successCount++;
      } catch (error) {
	console.log("Error clearing dates for item: " + error);
      }
    });

    // Show success notification
    const itemText = successCount === 1 ? "item" : "items";
    new Notification("Dates cleared", `${successCount} ${itemText} processed`).show();
  });

  action.validate = function(selection, sender) {
    // Enable if there are selected tasks or projects
    return selection.databaseObjects.some(obj =>
      obj instanceof Task || obj instanceof Project
    );
  };

  return action;
})();
