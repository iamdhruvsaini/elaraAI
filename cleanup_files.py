"""
GlamAI - File Cleanup Utility
Automated cleanup of temporary and old files
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from loguru import logger

# Configure logger
logger.add("logs/cleanup.log", rotation="1 week")


class FileCleanup:
    """Utility to clean up temporary and old files"""
    
    def __init__(self, base_path: str = "static"):
        self.base_path = Path(base_path)
        self.stats = {
            "scanned": 0,
            "deleted": 0,
            "errors": 0,
            "space_freed": 0
        }
    
    def cleanup_temp_files(self, hours: int = 24):
        """Delete temporary files older than specified hours"""
        logger.info(f"Cleaning temp files older than {hours} hours")
        
        temp_dir = self.base_path / "temp"
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        if not temp_dir.exists():
            logger.warning(f"Directory {temp_dir} does not exist")
            return
        
        for file_path in temp_dir.glob("*"):
            if file_path.is_file() and file_path.name != ".gitkeep":
                self._check_and_delete(file_path, cutoff_time)
    
    def cleanup_uploads(self, hours: int = 24):
        """Delete uploaded files older than specified hours"""
        logger.info(f"Cleaning uploads older than {hours} hours")
        
        uploads_dir = self.base_path / "uploads"
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        if not uploads_dir.exists():
            logger.warning(f"Directory {uploads_dir} does not exist")
            return
        
        for file_path in uploads_dir.glob("*"):
            if file_path.is_file() and file_path.name != ".gitkeep":
                self._check_and_delete(file_path, cutoff_time)
    
    def cleanup_old_faces(self, keep_latest: int = 1):
        """Keep only latest N face images per user"""
        logger.info(f"Cleaning old face images, keeping latest {keep_latest} per user")
        
        faces_dir = self.base_path / "faces"
        
        if not faces_dir.exists():
            logger.warning(f"Directory {faces_dir} does not exist")
            return
        
        # Group files by user_id
        user_files = {}
        for file_path in faces_dir.glob("user_*"):
            if file_path.is_file():
                try:
                    # Extract user_id from filename: user_{id}_{timestamp}_{uuid}.jpg
                    parts = file_path.stem.split("_")
                    if len(parts) >= 2:
                        user_id = parts[1]
                        if user_id not in user_files:
                            user_files[user_id] = []
                        user_files[user_id].append(file_path)
                except Exception as e:
                    logger.error(f"Error parsing filename {file_path}: {e}")
        
        # For each user, keep only latest N files
        for user_id, files in user_files.items():
            # Sort by modification time, newest first
            files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # Delete older files
            for file_path in files[keep_latest:]:
                self._delete_file(file_path)
    
    def cleanup_session_files(self, days: int = 30):
        """Delete session-related files older than specified days"""
        logger.info(f"Cleaning session files older than {days} days")
        
        cutoff_time = datetime.now() - timedelta(days=days)
        
        # Clean outfits
        outfits_dir = self.base_path / "outfits"
        if outfits_dir.exists():
            for file_path in outfits_dir.glob("*"):
                if file_path.is_file() and file_path.name != ".gitkeep":
                    self._check_and_delete(file_path, cutoff_time)
        
        # Clean accessories
        accessories_dir = self.base_path / "accessories"
        if accessories_dir.exists():
            for file_path in accessories_dir.glob("*"):
                if file_path.is_file() and file_path.name != ".gitkeep":
                    self._check_and_delete(file_path, cutoff_time)
    
    def _check_and_delete(self, file_path: Path, cutoff_time: datetime):
        """Check file age and delete if older than cutoff"""
        self.stats["scanned"] += 1
        
        try:
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            if file_time < cutoff_time:
                self._delete_file(file_path)
        except Exception as e:
            logger.error(f"Error checking file {file_path}: {e}")
            self.stats["errors"] += 1
    
    def _delete_file(self, file_path: Path):
        """Delete a file and update stats"""
        try:
            file_size = file_path.stat().st_size
            file_path.unlink()
            
            self.stats["deleted"] += 1
            self.stats["space_freed"] += file_size
            
            logger.info(f"Deleted: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting {file_path}: {e}")
            self.stats["errors"] += 1
    
    def get_directory_size(self, directory: str = None) -> int:
        """Get total size of directory in bytes"""
        if directory:
            dir_path = self.base_path / directory
        else:
            dir_path = self.base_path
        
        total_size = 0
        
        for file_path in dir_path.rglob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size
        
        return total_size
    
    def print_stats(self):
        """Print cleanup statistics"""
        print("\n" + "="*50)
        print("CLEANUP STATISTICS")
        print("="*50)
        print(f"Files scanned: {self.stats['scanned']}")
        print(f"Files deleted: {self.stats['deleted']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Space freed: {self._format_bytes(self.stats['space_freed'])}")
        print("="*50 + "\n")
    
    def print_storage_summary(self):
        """Print storage usage summary"""
        print("\n" + "="*50)
        print("STORAGE USAGE SUMMARY")
        print("="*50)
        
        directories = ["uploads", "temp", "faces", "outfits", "accessories", "makeup_results"]
        
        for directory in directories:
            size = self.get_directory_size(directory)
            count = self._count_files(self.base_path / directory)
            print(f"{directory:20s}: {self._format_bytes(size):>10s} ({count} files)")
        
        total_size = self.get_directory_size()
        total_count = self._count_files(self.base_path)
        print("-"*50)
        print(f"{'TOTAL':20s}: {self._format_bytes(total_size):>10s} ({total_count} files)")
        print("="*50 + "\n")
    
    @staticmethod
    def _format_bytes(bytes_size: int) -> str:
        """Format bytes to human readable string"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.2f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.2f} TB"
    
    @staticmethod
    def _count_files(directory: Path) -> int:
        """Count files in directory"""
        if not directory.exists():
            return 0
        return sum(1 for f in directory.rglob("*") if f.is_file() and f.name != ".gitkeep")


def main():
    """Main cleanup routine"""
    print("🧹 GlamAI File Cleanup Utility")
    print("="*50)
    
    cleanup = FileCleanup()
    
    # Show current storage usage
    cleanup.print_storage_summary()
    
    # Perform cleanup
    print("Starting cleanup...")
    
    # Clean temp files older than 1 hour
    cleanup.cleanup_temp_files(hours=1)
    
    # Clean uploads older than 24 hours
    cleanup.cleanup_uploads(hours=24)
    
    # Keep only latest face image per user
    cleanup.cleanup_old_faces(keep_latest=1)
    
    # Clean session files older than 30 days
    cleanup.cleanup_session_files(days=30)
    
    # Show results
    cleanup.print_stats()
    cleanup.print_storage_summary()
    
    logger.info("Cleanup completed successfully")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cleanup cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        print(f"\n❌ Error: {e}")
        sys.exit(1)