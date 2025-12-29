#!/usr/bin/env python3
"""Hot reload watcher for the application."""

import subprocess
import sys
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


class ReloadHandler(FileSystemEventHandler):
    """Handler for file system events."""
    
    def __init__(self, script_path):
        self.script_path = script_path
        self.process = None
        self.run_script()
    
    def run_script(self):
        """Run the main script."""
        if self.process:
            self.process.terminate()
            self.process.wait()
        
        print(f"\n{'='*50}")
        print("Reloading...")
        print(f"{'='*50}\n")
        
        self.process = subprocess.Popen(
            [sys.executable, self.script_path],
            stdout=sys.stdout,
            stderr=sys.stderr,
            stdin=sys.stdin,
            bufsize=0  # Unbuffered for interactive input
        )
    
    def on_modified(self, event):
        """Handle file modification events."""
        # Игнорируем изменения в кэше и временных файлах
        if event.src_path.endswith('.py') and '.cache' not in event.src_path:
            self.run_script()


def main():
    """Main function to start the watcher."""
    script_path = 'main.py'
    
    print("Starting hot reload watcher...")
    print(f"Watching: {script_path}")
    print("Press Ctrl+C to stop\n")
    
    event_handler = ReloadHandler(script_path)
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if event_handler.process:
            event_handler.process.terminate()
            event_handler.process.wait()
    
    observer.join()
    print("\nStopped watcher.")


if __name__ == '__main__':
    main()

