import sys

target = """  useEffect(() => {
    localStorage.setItem('safretk_notifications', JSON.stringify(notifications));
  }, [notifications]);"""

replacement = """  useEffect(() => {
    localStorage.setItem('safretk_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'safretk_notifications' && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue));
        } catch(err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
