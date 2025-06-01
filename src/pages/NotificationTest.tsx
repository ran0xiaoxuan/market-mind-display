
import { Navbar } from "@/components/Navbar";
import { TestNotifications } from "@/components/TestNotifications";
import { NotificationLogs } from "@/components/NotificationLogs";

export default function NotificationTest() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-6 px-4 md:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notification Testing</h1>
            <p className="text-muted-foreground">
              Test your notification settings and view delivery logs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TestNotifications />
            <NotificationLogs />
          </div>
        </div>
      </main>
    </div>
  );
}
