(() => {
	var Preferences = new PlugIn.Library(new Version("1.0"));

	// Preference keys (no need for full identifier - Preferences class handles prefixing)
	const PREF_FIRST_RUN = "firstRun";
	const PREF_USE_FLAGS = "useFlags";
	const PREF_DEFAULT_DATE_TYPE = "defaultDateType";

	// Check if this is the first run
	// Note: preferences instance must be created in the action, not library
	Preferences.isFirstRun = function(preferences) {
		const firstRun = preferences.read(PREF_FIRST_RUN);
		return firstRun === null;
	};

	// Mark first run as complete
	Preferences.setFirstRunComplete = function(preferences) {
		preferences.write(PREF_FIRST_RUN, false);
	};

	// Get flag setting
	Preferences.getUseFlags = function(preferences) {
		const useFlags = preferences.read(PREF_USE_FLAGS);
		return useFlags !== null ? useFlags : false;
	};

	// Set flag setting
	Preferences.setUseFlags = function(preferences, useFlags) {
		preferences.write(PREF_USE_FLAGS, useFlags);
	};

	// Get default date type
	Preferences.getDefaultDateType = function(preferences) {
		const dateType = preferences.read(PREF_DEFAULT_DATE_TYPE);
		return dateType !== null ? dateType : "defer"; // Default to defer like original
	};

	// Set default date type
	Preferences.setDefaultDateType = function(preferences, dateType) {
		preferences.write(PREF_DEFAULT_DATE_TYPE, dateType);
	};

	// Show first-run preferences dialog
	Preferences.showFirstRunDialog = function(preferences) {
		const flagField = new Form.Field.Checkbox(
			"useFlags",
			"Automatically flag tasks when rescheduled?",
			this.getUseFlags(preferences)
		);

		const dateTypeField = new Form.Field.Option(
			"dateType",
			"Default date type to set:",
			["defer", "due"],
			["Start (Defer)", "Due"],
			this.getDefaultDateType(preferences)
		);

		const form = new Form();
		form.addField(flagField);
		form.addField(dateTypeField);

		const promise = form.show("Later - First Run Setup", "Save Preferences");

		return promise.then(formObject => {
			const useFlags = formObject.values["useFlags"];
			const dateType = formObject.values["dateType"];

			this.setUseFlags(preferences, useFlags);
			this.setDefaultDateType(preferences, dateType);
			this.setFirstRunComplete(preferences);

			return { useFlags, dateType };
		});
	};

	// Show preferences dialog (for changing settings later)
	Preferences.showPreferencesDialog = function(preferences) {
		const flagField = new Form.Field.Checkbox(
			"useFlags",
			"Automatically flag tasks when rescheduled?",
			this.getUseFlags(preferences)
		);

		const dateTypeField = new Form.Field.Option(
			"dateType",
			"Default date type to set:",
			["defer", "due"],
			["Start (Defer)", "Due"],
			this.getDefaultDateType(preferences)
		);

		const form = new Form();
		form.addField(flagField);
		form.addField(dateTypeField);

		const promise = form.show("Later - Preferences", "Save Preferences");

		return promise.then(formObject => {
			const useFlags = formObject.values["useFlags"];
			const dateType = formObject.values["dateType"];

			this.setUseFlags(preferences, useFlags);
			this.setDefaultDateType(preferences, dateType);

			return { useFlags, dateType };
		});
	};

	return Preferences;
})();