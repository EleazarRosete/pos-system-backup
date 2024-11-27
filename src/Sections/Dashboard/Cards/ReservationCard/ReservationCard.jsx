import React, { useState, useEffect } from "react";
import styles from './ReservationCard.module.css';

function ReservationCard() {
    const [reservations, setReservations] = useState({
        today: [],
        upcoming: []
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [modalData, setModalData] = useState(null); // State to store modal data
    const [showModal, setShowModal] = useState(false); // State to control modal visibility

    const getReservations = async () => {
        try {
            const response = await fetch("http://localhost:5000/order/get-reservation", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch reservations");
            }
            const jsonData = await response.json();
    
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISOString = today.toISOString().split("T")[0]; // 'YYYY-MM-DD'
    
            const sortedReservations = jsonData.sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date));
    
            const todayReservations = sortedReservations.filter(reservation => {
                const reservationDate = new Date(reservation.reservation_date).toISOString().split("T")[0]; // 'YYYY-MM-DD'
                return reservationDate === todayISOString;
            });
    
            const upcomingReservations = sortedReservations.filter(reservation => {
                const reservationDate = new Date(reservation.reservation_date).toISOString().split("T")[0];
                return reservationDate > todayISOString;
            });
    
            setReservations({
                today: todayReservations,
                upcoming: upcomingReservations
            });
        } catch (err) {
            setErrorMessage(err.message);
            console.error('Error fetching reservations:', err.message);
        }
    };
    

    const cancelReservation = async (reservation_id) => {
        try {
            const response = await fetch(`http://localhost:5000/order/cancel-reservation/${reservation_id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            
            if (!response.ok) {
                const errorText = await response.text();  // Get the response body text for debugging
                throw new Error(`Error canceling reservation: ${response.status} - ${errorText}`);
            }
   
            setReservations(prevState => ({
                today: prevState.today.filter(res => res.reservation_id !== reservation_id),
                upcoming: prevState.upcoming.filter(res => res.reservation_id !== reservation_id),
            }));
            setShowConfirmation(false);
        } catch (err) {
            setErrorMessage(err.message);
            console.error('Error canceling reservation:', err.message);
        }
    };

    const formatTime = (timeStr) => {
        const date = new Date(`1970-01-01T${timeStr}`);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleCancelClick = (reservation_id) => {
        setReservationToCancel(reservation_id);
        setShowConfirmation(true);
    };

    const openModal = (reservationDetails) => {
        setModalData(reservationDetails); // Set the reservation details to display in the modal
        setShowModal(true); // Show the modal
        setReservationToCancel(reservationDetails.reservation_id);
    };

    const closeModal = () => {
        setShowModal(false); // Hide the modal
        setModalData(null); // Clear the modal data
    };

    useEffect(() => {
        getReservations();
    }, []);

    return (
        <section className={styles.section}>
                <h2 className={styles.txtSyles}>Today's Reservations</h2>
                {reservations.today.length > 0 ? (
                    reservations.today.map(({ reservation_id, first_name, last_name, guest_number, reservation_date, reservation_time }) => (
                        <div key={reservation_id} className={styles.reservationItem}>
                            <p><strong>Guest number : </strong> {guest_number}</p>
                            <p><strong>Name : </strong> {first_name} {last_name}</p>
                            <p><strong>Reservation Date:</strong> {formatDate(reservation_date)}</p>
                            <p><strong>Reservation Time:</strong> {formatTime(reservation_time)}</p>
                            <button 
                                className={styles.detailsButton}
                                onClick={() => openModal({ reservation_id,guest_number, customer_name: `${first_name} ${last_name}`, reservation_date })}
                            >
                                View Details
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No reservations for today.</p>
                )}

                <h2 className={styles.txtSyles}>Upcoming Reservations</h2>
                {reservations.upcoming.length > 0 ? (
                    reservations.upcoming.map(({ reservation_id, first_name, last_name, guest_number, reservation_date, reservation_time }) => (
                        <div key={reservation_id} className={styles.reservationItem}>
                            <p><strong>Guest number : </strong> {guest_number}</p>
                            <p><strong>Name : </strong> {first_name} {last_name}</p>
                            <p><strong>Reservation Date:</strong> {formatDate(reservation_date)}</p>
                            <p><strong>Reservation Time:</strong> {formatTime(reservation_time)}</p>
                            <button 
                                className={styles.detailsButton}
                                onClick={() => handleCancelClick(reservation_id)}
                            >
                                Cancel
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No upcoming reservations found.</p>
                )}

                {errorMessage && <p className={styles.error}>{errorMessage}</p>}

            {showConfirmation && (
                <div className={styles.confirmationModal}>
                    <div className={styles.modalContent}>
                        <p>Are you sure you want to cancel this reservation?</p>
                        <div className={styles.modalButtons}>
                            <button onClick={() => setShowConfirmation(false)}>Cancel</button>
                            <button onClick={() => cancelReservation(reservationToCancel)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && modalData && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>Reservation Details</h3>
                        <p><strong>Guest Number:</strong> {modalData.guest_number}</p>
                        <p><strong>Customer Name:</strong> {modalData.customer_name}</p>
                        <p><strong>Reservation Date:</strong> {formatDate(modalData.reservation_date)}</p>
                        <button onClick={() => cancelReservation(reservationToCancel)}>Cancel</button>
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ReservationCard;