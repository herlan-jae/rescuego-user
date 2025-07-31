document.addEventListener("DOMContentLoaded", () => {
  if (typeof API_BASE_URL === "undefined" || typeof showSnackbar === "undefined" || typeof apiFetch === "undefined") {
    console.error("Dependency JavaScript tidak ditemukan.");
    return;
  }

  const currentReservationsContainer = document.getElementById("active-reservation-container");
  const historyReservationsContainer = document.getElementById("history-reservation-container");
  const modal = document.getElementById("reservationModal");
  const modalBox = document.getElementById("modalBox");
  const closeModalBtn = document.getElementById("closeModal");
  const modalContent = document.getElementById("modal-content");
  const cancelButton = document.getElementById("cancelButton");

  let currentReservationId = null;
  const LOGIN_REDIRECT_URL = "login_screen.html";
  const RESERVATION_API_ENDPOINT = `${API_BASE_URL}/reservations/api/`;

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

  const createReservationCard = (reservation) => {
    const statusInfo = getStatusInfo(reservation.status);
    const destination = reservation.destination_city || "Tujuan";
    const card = document.createElement("button");
    card.className = `w-full bg-white p-4 rounded-lg shadow-sm border-l-4 border-${statusInfo.color}-500 flex justify-between items-center text-left transition hover:shadow-md`;
    card.dataset.id = reservation.id;
    card.innerHTML = `
      <div>
        <p class="font-semibold text-gray-800">${destination}</p>
        <p class="text-sm text-${statusInfo.color}-600 font-medium">${statusInfo.text}</p>
      </div>
      <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
    `;
    return card;
  };

  const loadReservations = async () => {
    currentReservationsContainer.innerHTML = `<p class="text-gray-500">Memuat...</p>`;
    historyReservationsContainer.innerHTML = `<p class="text-gray-500">Memuat...</p>`;
    try {
      const data = await apiFetch(RESERVATION_API_ENDPOINT, {}, LOGIN_REDIRECT_URL);
      const reservations = data.results || data || [];

      const active = reservations.filter((r) => !["completed", "cancelled", "rejected"].includes(r.status));
      const history = reservations.filter((r) => ["completed", "cancelled", "rejected"].includes(r.status));

      currentReservationsContainer.innerHTML = active.length > 0 ? "" : `<p class="text-gray-500">Tidak ada reservasi aktif.</p>`;
      active.forEach((res) => currentReservationsContainer.appendChild(createReservationCard(res)));

      historyReservationsContainer.innerHTML = history.length > 0 ? "" : `<p class="text-gray-500">Belum ada riwayat reservasi.</p>`;
      history.forEach((res) => historyReservationsContainer.appendChild(createReservationCard(res)));
    } catch (error) {
      currentReservationsContainer.innerHTML = `<p class="text-red-500">Gagal memuat data.</p>`;
      historyReservationsContainer.innerHTML = "";
    }
  };

  const showDetailModal = async (id) => {
    currentReservationId = id;
    modalContent.innerHTML = `<p class="text-center text-gray-500">Memuat detail...</p>`;
    modal.classList.remove("hidden");
    try {
      const detail = await apiFetch(`${RESERVATION_API_ENDPOINT}${id}/`, {}, LOGIN_REDIRECT_URL);
      const statusInfo = getStatusInfo(detail.status);
      modalContent.innerHTML = `
        <div class="space-y-1">
          <p><span class="font-semibold w-28 inline-block">Pasien:</span> ${detail.patient_name || "-"}</p>
          <p><span class="font-semibold w-28 inline-block">Status:</span> <b class="text-${statusInfo.color}-600">${statusInfo.text}</b></p>
          <p><span class="font-semibold w-28 inline-block">Dari:</span> ${detail.pickup_address || "-"}</p>
          <p><span class="font-semibold w-28 inline-block">Tujuan:</span> ${detail.destination_address || "-"}</p>
        </div>
        <div class="space-y-1 border-t mt-3 pt-3">
          <p><span class="font-semibold w-28 inline-block">Supir:</span> ${detail.assigned_driver_details?.name || "---"}</p>
          <p><span class="font-semibold w-28 inline-block">Ambulans:</span> ${detail.assigned_ambulance_details?.license_plate || "---"}</p>
        </div>
      `;
      if (["pending", "accepted"].includes(detail.status)) {
        cancelButton.classList.remove("hidden");
      } else {
        cancelButton.classList.add("hidden");
      }
    } catch (error) {
      modalContent.innerHTML = `<p class="text-center text-red-500">Gagal memuat detail.</p>`;
      cancelButton.classList.add("hidden");
    }
  };

  const closeModal = () => modal.classList.add("hidden");

  const handleCancelReservation = () => {
    if (!currentReservationId) return;

    const confirmationModal = document.getElementById("confirmationModal");
    document.getElementById("confirm-title").textContent = "Konfirmasi Pembatalan";
    document.getElementById("confirm-message").textContent = "Apakah Anda yakin ingin membatalkan reservasi ini?";
    document.getElementById("confirm-ok-btn").textContent = "Ya, Batalkan";
    confirmationModal.classList.remove("hidden");

    const handleConfirm = async () => {
      confirmationModal.classList.add("hidden");
      try {
        await apiFetch(`${RESERVATION_API_ENDPOINT}${currentReservationId}/cancel/`, { method: "POST" });
        showSnackbar("Reservasi berhasil dibatalkan.", "success");
        closeModal();
        loadReservations();
      } catch (error) {
        showSnackbar(error.message || "Gagal membatalkan reservasi.", "error");
      } finally {
        cleanup();
      }
    };
    const handleCancel = () => {
      confirmationModal.classList.add("hidden");
      cleanup();
    };
    const cleanup = () => {
      document.getElementById("confirm-ok-btn").removeEventListener("click", handleConfirm);
      document.getElementById("confirm-cancel-btn").removeEventListener("click", handleCancel);
    };
    document.getElementById("confirm-ok-btn").addEventListener("click", handleConfirm, { once: true });
    document.getElementById("confirm-cancel-btn").addEventListener("click", handleCancel, { once: true });
  };

  currentReservationsContainer.addEventListener("click", (e) => {
    const card = e.target.closest("button[data-id]");
    if (card) showDetailModal(card.dataset.id);
  });
  historyReservationsContainer.addEventListener("click", (e) => {
    const card = e.target.closest("button[data-id]");
    if (card) showDetailModal(card.dataset.id);
  });

  closeModalBtn.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", handleCancelReservation);

  loadReservations();
});
