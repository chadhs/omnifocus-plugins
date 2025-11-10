/*
	Later for OmniFocus 4
	JavaScript version of the Later AppleScript by Chris Sauve

	Defer selected tasks using natural language input.
	Supports relative dates, absolute dates, weekdays, and dual date input.
*/

(() => {
	// Simple date parsing function
	const parseDate = function(input) {
		if (!input || input.trim() === "") return null;
		input = input.trim().toLowerCase();

		// Handle dual date input (start/due)
		if (input.includes('start') && input.includes('due')) {
			const startMatch = input.match(/start\s+(.+?)(?=\s+due|$)/);
			const dueMatch = input.match(/due\s+(.+?)(?=\s+start|$)/);

			if (!startMatch && !dueMatch) return null;
			const result = {};

			if (startMatch) {
				const startDate = parseSingleDate(startMatch[1].trim(), false);
				if (!startDate) return null;
				result.defer = startDate;
			}

			if (dueMatch) {
				const dueDate = parseSingleDate(dueMatch[1].trim(), true);
				if (!dueDate) return null;
				result.due = dueDate;
			}

			return result;
		}

		// Handle single keyword with date (due 1w, start 2d)
		const keywordMatch = input.match(/^(due|start)\s+(.+)$/);
		if (keywordMatch) {
			const keyword = keywordMatch[1];
			const dateStr = keywordMatch[2].trim();
			const date = parseSingleDate(dateStr, keyword === 'due');
			if (!date) return null;

			const result = {};
			if (keyword === 'due') {
				result.due = date;
			} else {
				result.defer = date;
			}
			return result;
		}

		// Handle single date input (default to defer date)
		const date = parseSingleDate(input, false);
		return date ? { defer: date, due: null } : null;
	};

	const parseSingleDate = function(input, isDueDate = false) {
		if (!input || input.trim() === "") return null;

		// Helper to apply OmniFocus default time
		const applyDefaultTime = function(date, isDueDate = false) {
			try {
				let defaultTime;
				if (isDueDate) {
					// Try multiple possible keys for due time
					defaultTime = settings.objectForKey("DefaultDueTime") || 
								 settings.objectForKey("DueTime") ||
								 settings.objectForKey("Due");
				} else {
					defaultTime = settings.objectForKey("DefaultStartTime");
				}
				
				if (defaultTime) {
					const timeComponents = getTimeComponentsFromString(defaultTime);
					date.setHours(timeComponents.hour, timeComponents.minute, 0, 0);
				} else {
					// Fallback times if no setting found
					if (isDueDate) {
						date.setHours(17, 0, 0, 0); // 5:00 PM fallback for due
					} else {
						date.setHours(9, 0, 0, 0); // 9:00 AM fallback for start
					}
				}
			} catch (error) {
				// Fallback times if settings access fails
				if (isDueDate) {
					date.setHours(17, 0, 0, 0); // 5:00 PM fallback for due
				} else {
					date.setHours(9, 0, 0, 0); // 9:00 AM fallback for start
				}
			}
			return date;
		};

		// Helper to parse time from OmniFocus setting string or components
		const getTimeComponentsFromString = function(timeValue) {
			// If OmniFocus returns DateComponents-like object
			if (timeValue && typeof timeValue === 'object') {
				if (typeof timeValue.hour === 'number') {
					return { hour: timeValue.hour, minute: typeof timeValue.minute === 'number' ? timeValue.minute : 0 };
				}
			}
			const timeString = String(timeValue || '').trim();
			// Handle HH:MM format
			const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
			if (timeMatch) {
				const hour = parseInt(timeMatch[1]);
				const minute = parseInt(timeMatch[2]);
				return { hour, minute };
			}
			
			// Fallback to Date parser (handles 5:00 PM, etc.)
			const placeholderDate = new Date("1/1/1 " + timeString);
			return {
				hour: placeholderDate.getHours(),
				minute: placeholderDate.getMinutes()
			};
		};

		// Special keywords
		if (input === 'now') {
			return new Date(); // Current date and time
		}

		if (input === 'today' || input === 'tod') {
			const today = new Date();
			return applyDefaultTime(today, isDueDate); // Apply correct default time based on context
		}

		if (input === 'tomorrow' || input === 'tom') {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			return applyDefaultTime(tomorrow, isDueDate); // Apply correct default time based on context
		}

		// Simple relative dates
		const dayMatch = input.match(/(\d+)\s*d/i);
		if (dayMatch) {
			const date = new Date();
			date.setDate(date.getDate() + parseInt(dayMatch[1]));
			return applyDefaultTime(date, isDueDate); // Apply correct default time based on context
		}

		const weekMatch = input.match(/(\d+)\s*w/i);
		if (weekMatch) {
			const date = new Date();
			date.setDate(date.getDate() + (parseInt(weekMatch[1]) * 7));
			return applyDefaultTime(date, isDueDate); // Apply correct default time based on context
		}

		// Try time parsing
		const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
		if (timeMatch) {
			const date = new Date();
			let hours = parseInt(timeMatch[1]);
			const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
			const period = timeMatch[3];

			if (period === 'pm' && hours < 12) hours += 12;
			if (period === 'am' && hours === 12) hours = 0;

			date.setHours(hours, minutes, 0, 0);
			return date;
		}

		return null;
	};

	const action = new PlugIn.Action(function(selection, sender) {
		// Check if we have valid selection
		const selectedItems = selection.databaseObjects.filter(obj =>
			obj instanceof Task || obj instanceof Project
		);

		if (selectedItems.length === 0) {
			new Alert("No valid task(s) selected", "Please select one or more tasks or projects.").show();
			return;
		}

		// Show main dialog directly
		action.showLaterDialog(selectedItems);
	});

	// Show the main Later dialog
	action.showLaterDialog = function(selectedItems) {
		// Create input form
		const inputField = new Form.Field.String(
			"dateInput",
			"Schedule tasks:",
			"1d"
		);

		// Add help text as a separate field (read-only)
		const helpField = new Form.Field.String(
			"helpText",
			"Examples:",
			"• 1d (defaults to defer)\n• 1d, 2w, 3h (relative dates)\n• today, tomorrow, now (keywords)\n• 4pm, 9am (times)\n• start 1d due 3d (both dates)"
		);

		const form = new Form();
		form.addField(inputField);
		form.addField(helpField);

		const formPromise = form.show("Later - Schedule Tasks", "Schedule");

		// Handle form validation
		form.validate = function(formObject) {
			const dateInput = formObject.values["dateInput"];

			if (!dateInput || dateInput.trim() === "") {
				throw new Error("Please enter a date or time.");
			}

			// Parse the date to validate it
			const parsedDates = parseDate(dateInput);
			if (!parsedDates) {
				throw new Error("Invalid date format. Try: 1d, 2w, today, tomorrow, or start 1d due 3d");
			}

			return true;
		};

		// Handle form submission
		formPromise.then(formObject => {
			const dateInput = formObject.values["dateInput"];

			if (!dateInput || dateInput.trim() === "") {
				throw new Error("Please enter a date or time.");
			}

			// Parse the date
			const parsedDates = parseDate(dateInput);
			if (!parsedDates) {
				throw new Error("Invalid date format. Try: 1d, 2w, today, tomorrow, or start 1d due 3d");
			}

			// Apply dates to selected items
			action.applyDatesToItems(selectedItems, parsedDates);
		});
	};

	// Apply parsed dates to selected items
	action.applyDatesToItems = function(selectedItems, parsedDates) {
		selectedItems.forEach(item => {
			try {
				// Apply defer date if present
				if (parsedDates.defer) {
					item.deferDate = parsedDates.defer;
				}

				// Apply due date if present
				if (parsedDates.due) {
					item.dueDate = parsedDates.due;
				}
			} catch (error) {
				// Silently handle errors
			}
		});
	};

	// Validate action (enable when tasks/projects are selected)
	action.validate = function(selection, sender) {
		return selection.databaseObjects.some(obj =>
			obj instanceof Task || obj instanceof Project
		);
	};

	return action;
})();
