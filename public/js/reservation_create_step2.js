document.addEventListener("DOMContentLoaded", () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    window.location.href = "/src/auth/login.html";
    return;
  }

  const emergencyTypeKey = sessionStorage.getItem("emergency_type_key");
  if (!emergencyTypeKey) {
    showSnackbar("Jenis darurat tidak ditemukan, silakan mulai lagi.", "error");
    setTimeout(() => (window.location.href = "reservation_create_step1.html"), 1500);
    return;
  }

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "reservation_create_step1.html";
  });

  document.getElementById("patientInfoForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const confirmBtn = document.getElementById("confirmBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Memproses...";

    const genderMapping = { "Laki-laki": "male", Perempuan: "female" };

    const payload = {
      emergency_type: emergencyTypeKey,
      patient_gender: genderMapping[document.getElementById("patient_gender").value],
      priority: "high",

      patient_name: document.getElementById("patient_name").value,
      patient_age: parseInt(document.getElementById("patient_age").value),
      patient_condition: document.getElementById("patient_condition").value,
      current_symptoms: document.getElementById("current_symptoms").value,
      medical_history: document.getElementById("medical_history").value,
      pickup_address: document.getElementById("pickup_address").value,
      destination_address: document.getElementById("destination_address").value,
      emergency_contact_name: document.getElementById("emergency_contact_name").value,
      emergency_contact_phone: document.getElementById("emergency_contact_phone").value,
      emergency_contact_relationship: document.getElementById("emergency_contact_relationship").value,
      pickup_city: "Jakarta",
      destination_city: "Jakarta",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/api/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join("\n");
        throw new Error(errorMessage || "Gagal membuat reservasi.");
      }

      showSnackbar("Reservasi berhasil dibuat!", "success");
      sessionStorage.removeItem("emergency_type_key");
      setTimeout(() => (window.location.href = "reservation_screen.html"), 1500);
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Konfirmasi";
    }
  });
});
