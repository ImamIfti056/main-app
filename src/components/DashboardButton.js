export function DashboardButton() {
  return (
    <>
      <button className="dashboard-btn">
          Go to Dashboard →
          <p>inside intentional block : this line should not be detected as changed</p>
      </button>

      <p>this line should be detecteddd as changed</p>
    </>
  );
}
