export function DashboardButton() {
  return (
    <>
      <button className="dashboard-btn">
          Go to Dashboard →
          <p>inside intentional blockkk : this line should not be detected as changed</p>
      </button>

      <p>this line should be detecteddd as changeddd</p>
    </>
  );
}
