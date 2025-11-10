(() => {
	var DateParser = new PlugIn.Library(new Version("1.0"));

	// Main parsing function - entry point
	DateParser.parse = function(input) {
		if (!input || input.trim() === "") return null;

		input = input.trim().toLowerCase();

		// Handle dual date input (start/due)
		if (input.includes('start') && input.includes('due')) {
			return this.parseDualDates(input);
		}

		// Handle single date input
		const date = this.parseSingleDate(input);
		return date ? { defer: date, due: null } : null;
	};

	// Parse dual date input like "start 1d due 1w"
	DateParser.parseDualDates = function(input) {
		const startMatch = input.match(/start\s+([^d]*?)(?=due|$)/);
		const dueMatch = input.match(/due\s+([^s]*?)(?=start|$)/);

		if (!startMatch && !dueMatch) return null;

		const result = {};

		if (startMatch) {
			const startDate = this.parseSingleDate(startMatch[1].trim());
			if (!startDate) return null;
			result.defer = startDate;
		}

		if (dueMatch) {
			const dueDate = this.parseSingleDate(dueMatch[1].trim());
			if (!dueDate) return null;
			result.due = dueDate;
		}

		return result;
	};

	// Parse single date input
	DateParser.parseSingleDate = function(input) {
		if (!input || input.trim() === "") return null;

		// Special keywords
		if (input === 'today' || input === 'tod') {
			return this.getTodayWithDefaultTime();
		}

		if (input === 'tomorrow' || input === 'tom') {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			return this.applyDefaultTime(tomorrow);
		}

		// Try absolute date first (month names, specific dates)
		const absoluteDate = this.parseAbsoluteDate(input);
		if (absoluteDate) return absoluteDate;

		// Try weekday
		const weekdayDate = this.parseWeekday(input);
		if (weekdayDate) return weekdayDate;

		// Try relative date
		const relativeDate = this.parseRelativeDate(input);
		if (relativeDate) return relativeDate;

		return null;
	};

	// Parse absolute dates like "jan 19", "dec 25 14:00"
	DateParser.parseAbsoluteDate = function(input) {
		const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
		const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

		// Check for month name
		let monthIndex = -1;
		for (let i = 0; i < months.length; i++) {
			if (input.includes(months[i]) || input.includes(monthNames[i])) {
				monthIndex = i;
				break;
			}
		}

		if (monthIndex === -1) return null;

		// Extract day and time
		const cleanInput = input.replace(/[^\d\s:ampm]/g, ' ').replace(/\s+/g, ' ').trim();
		const parts = cleanInput.split(' ');

		let day = 1;
		let timeStr = null;

		// Find day number
		for (const part of parts) {
			const num = parseInt(part);
			if (num && num >= 1 && num <= 31) {
				day = num;
			} else if (part.includes(':') || part.includes('am') || part.includes('pm')) {
				timeStr = part;
			}
		}

		const date = new Date();
		date.setDate(1);
		date.setMonth(monthIndex);
		date.setDate(day);

		// If date is in the past, move to next year
		if (date < new Date()) {
			date.setFullYear(date.getFullYear() + 1);
		}

		// Apply time if specified
		if (timeStr) {
			const time = this.parseTime(timeStr);
			if (time) {
				date.setHours(time.hours, time.minutes, 0, 0);
			}
		} else {
			this.applyDefaultTime(date);
		}

		return date;
	};

	// Parse weekdays like "sat 5pm", "monday"
	DateParser.parseWeekday = function(input) {
		const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
		const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

		let weekdayIndex = -1;
		for (let i = 0; i < weekdays.length; i++) {
			if (input.includes(weekdays[i]) || input.includes(weekdayNames[i])) {
				weekdayIndex = i;
				break;
			}
		}

		if (weekdayIndex === -1) return null;

		const today = new Date();
		const todayWeekday = today.getDay();

		let daysUntil = weekdayIndex - todayWeekday;
		if (daysUntil <= 0) {
			daysUntil += 7; // Next occurrence
		}

		const targetDate = new Date(today);
		targetDate.setDate(today.getDate() + daysUntil);

		// Extract time if specified
		const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
		if (timeMatch) {
			const time = this.parseTime(timeMatch[0]);
			if (time) {
				targetDate.setHours(time.hours, time.minutes, 0, 0);
			} else {
				this.applyDefaultTime(targetDate);
			}
		} else {
			this.applyDefaultTime(targetDate);
		}

		return targetDate;
	};

	// Parse relative dates like "1d 4am", "2w 3d", "3h"
	DateParser.parseRelativeDate = function(input) {
		const now = new Date();
		let targetDate = new Date(now);

		// Extract time components
		const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
		let timeComponents = null;

		if (timeMatch) {
			timeComponents = this.parseTime(timeMatch[0]);
		}

		// Parse relative components
		const weekMatch = input.match(/(\d+)\s*w/i);
		const dayMatch = input.match(/(\d+)\s*d/i);
		const hourMatch = input.match(/(\d+)\s*h/i);

		if (weekMatch) {
			targetDate.setDate(targetDate.getDate() + (parseInt(weekMatch[1]) * 7));
		}

		if (dayMatch) {
			targetDate.setDate(targetDate.getDate() + parseInt(dayMatch[1]));
		}

		if (hourMatch) {
			targetDate.setHours(targetDate.getHours() + parseInt(hourMatch[1]));
		}

		// Apply time if specified
		if (timeComponents) {
			targetDate.setHours(timeComponents.hours, timeComponents.minutes, 0, 0);
		} else {
			this.applyDefaultTime(targetDate);
		}

		return targetDate;
	};

	// Parse time strings like "4am", "4:30pm", "16:00"
	DateParser.parseTime = function(timeStr) {
		if (!timeStr) return null;

		const cleanTime = timeStr.toLowerCase().trim();

		// Handle HH:MM format
		const colonMatch = cleanTime.match(/^(\d{1,2}):(\d{2})(\s*(am|pm))?$/i);
		if (colonMatch) {
			let hours = parseInt(colonMatch[1]);
			const minutes = parseInt(colonMatch[2]);
			const period = colonMatch[4];

			if (period === 'pm' && hours < 12) hours += 12;
			if (period === 'am' && hours === 12) hours = 0;

			return { hours, minutes };
		}

		// Handle simple format like "4am", "4pm"
		const simpleMatch = cleanTime.match(/^(\d{1,2})(\s*(am|pm))?$/i);
		if (simpleMatch) {
			let hours = parseInt(simpleMatch[1]);
			const period = simpleMatch[3];

			if (period === 'pm' && hours < 12) hours += 12;
			if (period === 'am' && hours === 12) hours = 0;

			return { hours, minutes: 0 };
		}

		return null;
	};

	// Get today with default time from OmniFocus settings
	DateParser.getTodayWithDefaultTime = function() {
		const today = new Date();
		return this.applyDefaultTime(today);
	};

	// Apply default time from OmniFocus settings
	DateParser.applyDefaultTime = function(date) {
		// For built-in OmniFocus settings, we need to use the settings object directly
		// These are OmniFocus application settings, not plugin preferences
		try {
			const defaultTime = settings.objectForKey("DefaultStartTime");
			if (defaultTime) {
				const timeComponents = this.getTimeComponentsFromString(defaultTime);
				date.setHours(timeComponents.hour, timeComponents.minute, 0, 0);
			} else {
				// Fallback to 9:00 AM if no setting found
				date.setHours(9, 0, 0, 0);
			}
		} catch (error) {
			// Fallback to 9:00 AM if settings access fails
			date.setHours(9, 0, 0, 0);
		}
		return date;
	};

	// Helper to parse time from OmniFocus setting string
	DateParser.getTimeComponentsFromString = function(timeString) {
		const placeholderDate = new Date("1/1/1 " + timeString);
		return {
			hour: placeholderDate.getHours(),
			minute: placeholderDate.getMinutes()
		};
	};

	return DateParser;
})();
