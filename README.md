# Student Todo List App

A desktop application that helps students manage their todos and Canvas assignments in one place. Built with Electron.

## Important Note for macOS Users

When you first try to open the app, you'll see a security warning. This is normal for open-source apps that aren't registered with Apple. Here's how to open it:

**Method 1 - Recommended (One-time setup):**
1. After downloading the `.dmg` file, double-click to mount it
2. Drag the app to your Applications folder
3. Go to Applications folder
4. Right-click (or Control-click) on "Student Todo List"
5. Select "Open" from the menu
6. Click "Open" in the security dialog
7. The app will now open, and you won't see this warning again

**Method 2 - Alternative:**
1. Open System Settings
2. Go to "Privacy & Security"
3. Scroll down to "Security"
4. Click "Open Anyway" next to the warning about Student Todo List
5. Click "Open" in the final dialog

**Why this happens:** 
- This warning appears because the app is open-source and not registered with Apple
- The app is completely safe - you can verify this by checking the source code on GitHub
- Once you open it the first time using either method above, it will open normally after that

## Features

- ✅ Create and manage todo lists with headers and tasks
- 🎓 Fetch assignments directly from Canvas
- 🌓 Dark/Light theme support
- 📌 Pin window functionality
- ⌨️ Keyboard shortcuts for quick actions
- 🔄 Drag and drop organization
- ↩️ Undo functionality

## Installation

### Download Pre-built App

Download the latest version for your platform from the [Releases](../../releases) page.

- **macOS**: Download the `.dmg` file and double-click to install
- **Windows**: Download the `.exe` installer
- **Linux**: Download either the `.AppImage` or `.deb` file

### Build from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/student-todo-list.git
   cd student-todo-list
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npm start
   ```

4. Build for your platform:
   ```bash
   # For macOS
   npm run build:mac
   
   # For Windows
   npm run build:win
   
   # For Linux
   npm run build:linux
   ```

## Canvas Integration

To use the Canvas integration:

1. Go to your Canvas account settings
2. Scroll to "Approved Integrations"
3. Click "+ New Access Token"
4. Enter a purpose (e.g., "Todo List App")
5. Generate and copy the token
6. Paste the token in the app when prompted

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: Focus new task input
- `Ctrl/Cmd + H`: Create new header
- `Ctrl/Cmd + D`: Toggle selected task completion
- `Ctrl/Cmd + Z`: Undo last action

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE) 