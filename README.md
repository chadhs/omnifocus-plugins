# OmniFocus 4 Plugins

JavaScript plugins for OmniFocus 4, converted from legacy AppleScript versions with modern enhancements.

## Plugins

### 🗑️ Clear Dates
Clears the defer (start) and due dates of selected tasks and projects.

**Features:**
- Removes both defer and due dates from selected items
- Simple, one-click operation
- Works with tasks and projects
- Clean, keyboard-friendly workflow

**Installation:**
1. Copy the `Clear Dates.omnifocusjs` folder to your OmniFocus plugins directory
2. Restart OmniFocus
3. The "Clear Dates" action will appear in the Automation menu

**Usage:** Select tasks/projects and run "Clear Dates" from the Automation menu or assign a keyboard shortcut.

---

### ⏰ Later
Defer selected tasks using fast, natural language input. Based on Chris Sauve's original AppleScript.

**Features:**
- Natural language parsing: `1d`, `2w`, `today`, `tomorrow`, `now`
- Time parsing: `4pm`, `9:30am`, `13:00`
- Dual date support: `start 1d due 3d`, `defer fri 4pm due mon 9am`
- Single keyword support: `due 1w`, `start 2d`
- Honors OmniFocus time preferences (5pm due times, your start times)
- Keyboard-first workflow with validation
- Error handling with helpful messages

**Installation:**
1. Copy the `Later.omnifocusjs` folder to your OmniFocus plugins directory
2. Restart OmniFocus
3. The "Later" action will appear in the Automation menu

**Quick Examples:**
- `1d` - Defer to tomorrow (uses your default start time)
- `due 3d` - Set due date in 3 days (uses 5pm default)
- `start 1d due 3d` - Start tomorrow, due in 3 days
- `today` - Today at your default start time
- `4pm` - Today at 4:00 PM
- `fri 5pm` - Next Friday at 5:00 PM

**Documentation:** See `Later.omnifocusjs/README.md` for complete usage guide and troubleshooting.

---

## Installation

### Quick Install
1. In OmniFocus, go to **Help > Open Plug-Ins Folder**
2. Copy the `.omnifocusjs` folders into the opened directory
3. Restart OmniFocus
4. Enable plugins if prompted

### Setting Keyboard Shortcuts
1. In OmniFocus, go to **OmniFocus > Settings > Keyboard**
2. Scroll down to the **Plug-Ins** section
3. Find the plugin in the list
4. Click in the shortcut column and set your desired hotkey

### Plugin Directory Location
The plugins directory is typically:
- `~/Library/Containers/com.omni-group.OmniFocus4/Data/Library/Application Support/OmniFocus/Plug-Ins/`

## Compatibility

- ✅ OmniFocus 4.0 or later
- ✅ macOS 12.0 (Monterey) or later
- ✅ Tested with OmniFocus 4.8+

## Credits

- **Clear Dates:** Originally by Dan Byler (AppleScript), converted to JavaScript by Chad Stovern
- **Later:** Originally by Chris Sauve (AppleScript), converted and enhanced by Chad Stovern

## License

MIT License - see individual plugin directories for details.