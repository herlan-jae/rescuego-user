document.addEventListener("DOMContentLoaded", () => {
  // Pastikan dependensi tersedia
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const welcomeMessage = document.getElementById("welcome-message");
  const currentContainer = document.getElementById("active-reservation-container");
  const historyContainer = document.getElementById("history-reservation-container");

  const LOGIN_REDIRECT_URL = "/src/auth/login.html";

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: "Menunggu Konfirmasi", color: "blue" },
      accepted: { text: "Diterima, Supir Segera Tiba", color: "yellow" },
      picking_up: { text: "Supir Dalam Perjalanan Menjemput", color: "yellow" },
      on_route: { text: "Anda Dalam Perjalanan ke RS", color: "green" },
      completed: { text: "Selesai", color: "gray" },
      cancelled: { text: "Dibatalkan", color: "red" },
      rejected: { text: "Ditolak", color: "red" },
    };
    return statusMap[status] || { text: status, color: "gray" };
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await apiFetch(`${API_BASE_URL}/accounts/api/profile/`, {}, LOGIN_REDIRECT_URL);
      if (welcomeMessage) {
        welcomeMessage.textContent = `Halo, ${profile.user.first_name || profile.user.username}!`;
      }
    } catch (error) {
      console.error("Gagal memuat profil:", error);
      if (welcomeMessage) {
        welcomeMessage.textContent = "Halo, Pengguna!";
      }
    }
  };

  const createReservationCard = (reservation) => {
    const statusInfo = getStatusInfo(reservation.status);
    const destination = reservation.destination_city || "Tujuan";

    const card = document.createElement("a");
    card.href = "reservation_screen.html";
    card.className = "bg-white rounded-xl shadow p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition";

    card.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-${statusInfo.color}-100 rounded-full">
            <svg class="w-6 h-6 text-${statusInfo.color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
            <p class="font-semibold text-gray-800">${destination}</p>
            <p class="text-sm text-${statusInfo.color}-600">${statusInfo.text}</p>
        </div>
      </div>
      <span class="text-gray-400 text-3xl font-bold">›</span>
    `;
    return card;
  };

  const fetchReservationsSummary = async () => {
    if (!currentContainer || !historyContainer) return;

    currentContainer.innerHTML = '<p class="text-sm text-gray-500">Memuat...</p>';
    historyContainer.innerHTML = '<p class="text-sm text-gray-500">Memuat...</p>';

    try {
      const data = await apiFetch(`${API_BASE_URL}/reservations/api/`, {}, LOGIN_REDIRECT_URL);
      const reservations = data.results || data || [];

      const current = reservations.filter((r) => !["completed", "cancelled", "rejected"].includes(r.status));
      const history = reservations.filter((r) => ["completed", "cancelled", "rejected"].includes(r.status));

      if (current.length > 0) {
        currentContainer.innerHTML = "";
        currentContainer.appendChild(createReservationCard(current[0]));
      } else {
        currentContainer.innerHTML = '<p class="text-sm text-gray-500">Tidak ada reservasi aktif.</p>';
      }

      if (history.length > 0) {
        historyContainer.innerHTML = "";
        history.slice(0, 2).forEach((res) => {
          historyContainer.appendChild(createReservationCard(res));
        });
      } else {
        historyContainer.innerHTML = '<p class="text-sm text-gray-500">Belum ada riwayat reservasi.</p>';
      }
    } catch (error) {
      console.error("Gagal memuat reservasi:", error);
      showSnackbar(error.message, "error");
      currentContainer.innerHTML = '<p class="text-sm text-red-500">Gagal memuat data.</p>';
      historyContainer.innerHTML = "";
    }
  };

  fetchUserProfile();
  fetchReservationsSummary();
});
