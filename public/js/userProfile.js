document.addEventListener("DOMContentLoaded", () => {
  if (typeof API_BASE_URL === "undefined") {
    console.error("API_BASE_URL tidak ditemukan. Pastikan utils.js sudah dimuat.");
    return;
  }
  if (typeof apiFetch === "undefined") {
    console.error("apiFetch tidak ditemukan. Pastikan apiHelper.js sudah dimuat.");
    return;
  }

  const API_PROFILE_URL = `${API_BASE_URL}/accounts/api/profile/`;
  const LOGIN_REDIRECT_URL = "/src/user/views/login_screen.html";
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    showSnackbar("Sesi Anda telah berakhir. Silakan login kembali.", "info");
    setTimeout(() => {
      window.location.href = LOGIN_REDIRECT_URL;
    }, 1000);
    return;
  }

  const profileForm = document.getElementById("profileForm");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveButtonText = document.getElementById("saveButtonText");
  const saveLoadingSpinner = document.getElementById("saveLoadingSpinner");
  const profileNameDisplay = document.getElementById("profile-name");
  const profileEmailDisplay = document.getElementById("profile-email");

  let initialProfileData = {};

  const inputs = {
    username: document.getElementById("username"),
    full_name: document.getElementById("full_name"),
    email: document.getElementById("email"),
    phone_number: document.getElementById("phone_number"),
    date_of_birth: document.getElementById("date_of_birth"),
    city: document.getElementById("city"),
    address: document.getElementById("address"),
    emergency_contact_name: document.getElementById("emergency_contact_name"),
    emergency_contact_phone: document.getElementById("emergency_contact_phone"),
  };

  const getCurrentFormData = () => {
    return {
      username: inputs.username?.value || "",
      full_name: inputs.full_name?.value || "",
      email: inputs.email?.value || "",
      phone_number: inputs.phone_number?.value || "",
      date_of_birth: inputs.date_of_birth?.value || null,
      city: inputs.city?.value || "",
      address: inputs.address?.value || "",
      emergency_contact_name: inputs.emergency_contact_name?.value || "",
      emergency_contact_phone: inputs.emergency_contact_phone?.value || "",
    };
  };

  const checkForChanges = () => {
    const currentData = getCurrentFormData();
    const comparableInitialData = { ...initialProfileData };
    const comparableCurrentData = { ...currentData };

    if (inputs.username?.disabled) delete comparableInitialData.username;
    if (inputs.username?.disabled) delete comparableCurrentData.username;
    if (inputs.email?.disabled) delete comparableInitialData.email;
    if (inputs.email?.disabled) delete comparableCurrentData.email;

    const hasChanged = JSON.stringify(comparableInitialData) !== JSON.stringify(comparableCurrentData);
    if (saveBtn) saveBtn.disabled = !hasChanged;
    if (cancelBtn) cancelBtn.disabled = !hasChanged;
  };

  const populateForm = (data) => {
    if (profileNameDisplay) {
      profileNameDisplay.textContent = data.full_name || data.username || "Pengguna";
    }
    if (profileEmailDisplay) {
      profileEmailDisplay.textContent = data.email || "N/A";
    }

    if (inputs.username) inputs.username.value = data.username || "";
    if (inputs.full_name) inputs.full_name.value = data.full_name || "";
    if (inputs.email) inputs.email.value = data.email || "";
    if (inputs.phone_number) inputs.phone_number.value = data.phone_number || "";
    if (inputs.date_of_birth) inputs.date_of_birth.value = data.date_of_birth || "";
    if (inputs.city) inputs.city.value = data.city || "";
    if (inputs.address) inputs.address.value = data.address || "";
    if (inputs.emergency_contact_name) inputs.emergency_contact_name.value = data.emergency_contact_name || "";
    if (inputs.emergency_contact_phone) inputs.emergency_contact_phone.value = data.emergency_contact_phone || "";
  };

  const loadProfileData = async () => {
    if (saveBtn) saveBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;

    try {
      const data = await apiFetch(API_PROFILE_URL, { method: "GET" }, LOGIN_REDIRECT_URL);
      populateForm(data);
      initialProfileData = getCurrentFormData();
      checkForChanges();
    } catch (error) {
      console.error("Error loading profile:", error);
      if (error.message !== "Unauthorized" && !error.message.includes("No access token")) {
        showSnackbar(error.message || "Gagal memuat data profil.", "error");
      }
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (saveBtn) {
      saveBtn.disabled = true;
      if (saveButtonText) saveButtonText.classList.add("hidden");
      if (saveLoadingSpinner) saveLoadingSpinner.classList.remove("hidden");
    }

    const dataToUpdate = getCurrentFormData();

    try {
      await apiFetch(
        API_PROFILE_URL,
        {
          method: "PATCH",
          body: JSON.stringify(dataToUpdate),
        },
        LOGIN_REDIRECT_URL
      );

      showSnackbar("Perubahan berhasil disimpan!", "success");
      await loadProfileData();
    } catch (error) {
      console.error("Error saving profile:", error);
      if (error.message !== "Unauthorized" && !error.message.includes("No access token")) {
        showSnackbar(error.message || "Gagal menyimpan perubahan.", "error");
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (saveButtonText) saveButtonText.classList.remove("hidden");
        if (saveLoadingSpinner) saveLoadingSpinner.classList.add("hidden");
      }
      checkForChanges();
    }
  };

  if (profileForm) {
    profileForm.addEventListener("submit", handleSaveProfile);
    Object.values(inputs).forEach((input) => {
      if (input) input.addEventListener("input", checkForChanges);
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      populateForm(initialProfileData);
      checkForChanges();
      showSnackbar("Perubahan dibatalkan.", "info");
    });
  }
  loadProfileData();

  const logoutBtn = document.getElementById("logoutBtn");
  const confirmationModal = document.getElementById("confirmationModal");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
  const confirmOkBtn = document.getElementById("confirm-ok-btn");
  const logoutButtonText = document.getElementById("logoutButtonText");
  const logoutLoadingSpinner = document.getElementById("logoutLoadingSpinner");

  if (logoutBtn && confirmationModal) {
    logoutBtn.addEventListener("click", () => {
      confirmTitle.textContent = "Konfirmasi Logout";
      confirmMessage.textContent = "Apakah Anda yakin ingin keluar dari akun ini?";
      confirmOkBtn.textContent = "Ya, Logout";
      confirmOkBtn.classList.remove("bg-red-600", "hover:bg-red-700", "bg-gray-200", "hover:bg-gray-300");
      confirmOkBtn.classList.add("bg-red-600", "hover:bg-red-700");
      confirmationModal.classList.remove("hidden");
      confirmationModal.classList.add("flex");
    });

    confirmCancelBtn.addEventListener("click", () => {
      confirmationModal.classList.add("hidden");
      confirmationModal.classList.remove("flex");
    });

    confirmOkBtn.addEventListener("click", async () => {
      confirmationModal.classList.add("hidden");
      confirmationModal.classList.remove("flex");

      if (logoutBtn) {
        logoutBtn.disabled = true;
        if (logoutButtonText) logoutButtonText.classList.add("hidden");
        if (logoutLoadingSpinner) logoutLoadingSpinner.classList.remove("hidden");
      }

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          await apiFetch(
            `${API_BASE_URL}/accounts/api/logout/`,
            {
              method: "POST",
              body: JSON.stringify({ refresh: refreshToken }),
            },
            LOGIN_REDIRECT_URL
          );
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        showSnackbar("Anda telah berhasil logout.", "success");
        setTimeout(() => {
          window.location.href = LOGIN_REDIRECT_URL;
        }, 1000);
      } catch (error) {
        console.error("Error during logout:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = LOGIN_REDIRECT_URL;
      } finally {
        if (logoutBtn) {
          logoutBtn.disabled = false;
          if (logoutButtonText) logoutButtonText.classList.remove("hidden");
          if (logoutLoadingSpinner) logoutLoadingSpinner.classList.add("hidden");
        }
      }
    });
  } else {
    console.warn("Tombol logout atau modal konfirmasi logout tidak ditemukan. Pastikan ID HTML sudah benar.");
  }
});
