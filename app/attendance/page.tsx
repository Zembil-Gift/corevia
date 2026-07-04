import { AttendanceClock } from "@/components/attendance/attendance-clock"

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-3xl p-6 md:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Scan an employee QR code to record attendance.
          </p>
        </div>
        <AttendanceClock />
      </main>
    </div>
  )
}
