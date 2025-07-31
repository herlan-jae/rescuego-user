document.addEventListener("DOMContentLoaded", () => {
  const emergencyTypes = {
    medical: "Darurat Medis",
    accident: "Kecelakaan Lalu Lintas",
    transfer: "Perpindahan Rumah Sakit",
    routine: "Perjalanan Rutin",
    other: "Keadaan Darurat Lainnya",
  };

  const form = document.getElementById("emergencyTypeForm");

  for (const [key, text] of Object.entries(emergencyTypes)) {
    const label = document.createElement("label");
    label.className = "radio-card";
    label.innerHTML = `
            <span class="font-medium text-gray-700">${text}</span>
            <input type="radio" name="emergency_type" value="${key}">
            <div class="radio-custom-circle"></div>
        `;
    form.appendChild(label);
  }

  document.getElementById("nextBtn").addEventListener("click", () => {
    const selectedType = document.querySelector('input[name="emergency_type"]:checked');
    if (selectedType) {
      sessionStorage.setItem("emergency_type_key", selectedType.value);
      window.location.href = "reservation_create_step2.html";
    } else {
      showSnackbar("Harap pilih jenis keadaan darurat.", "error");
    }
  });
});
