import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import austriaImg from '../assets/austria.jpg';
import belgiumImg from '../assets/belgium.jpg';
import brazilImg from '../assets/brazil.jpg';
import canadaImg from '../assets/canada.jpg';
import chinaImg from '../assets/china.jpg';
import croatiaImg from '../assets/croatia.jpg';
import denmarkImg from '../assets/denmark.jpg';
import egyptImg from '../assets/egypt.jpg';
import franceImg from '../assets/france.jpg';
import germanyImg from '../assets/germany.jpg';
import greeceImg from '../assets/greece.jpg';
import hungaryImg from '../assets/hungary.jpg';
import indiaImg from '../assets/india.jpg';
import italyImg from '../assets/italy.jpg';
import japanImg from '../assets/japan.jpg';
import koreaImg from '../assets/korea.jpg';
import maltaImg from '../assets/malta.jpg';
import portugalImg from '../assets/portugal.jpg';
import romaniaImg from '../assets/romania.jpg';
import spainImg from '../assets/spain.jpg';
import ukImg from '../assets/uk.jpg';
import usaImg from '../assets/usa.jpg';
import defaultImg from '../assets/sky.png';
import australiaImg from '../assets/australia.jpg';
import '../styles/TripCard.css';

const countryImages = {
  austria: austriaImg,
  australia: australiaImg,
  belgium: belgiumImg,
  brazil: brazilImg,
  canada: canadaImg,
  china: chinaImg,
  croatia: croatiaImg,
  denmark: denmarkImg,
  egypt: egyptImg,
  france: franceImg,
  germany: germanyImg,
  greece: greeceImg,
  hungary: hungaryImg,
  india: indiaImg,
  italy: italyImg,
  japan: japanImg,
  korea: koreaImg,
  malta: maltaImg,
  portugal: portugalImg,
  romania: romaniaImg,
  spain: spainImg,
  uk: ukImg,
  'united kingdom': ukImg,
  england: ukImg,
  usa: usaImg,
  america: usaImg,
  'united states': usaImg,
  'united states of america': usaImg
};

function TripCard({ trip, onEdit, onDelete, canUpdateTrip, canDeleteTrip }) {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  };

  const handleCardClick = () => {
    navigate(`/trip/${trip.id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(trip.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(trip.id);
  };

  const normalizedCountry = trip.country?.trim().toLowerCase() || '';
  const tripImage = countryImages[normalizedCountry] || defaultImg;

  const title = trip.country || trip.destination || 'Unknown destination';
  const subtitle = trip.city || '';

  return (
    <article className="trip-card" onClick={handleCardClick}>
      <div className="trip-info with-image">
        <div className="trip-text-content">
          <div className="trip-header-text">
            <h3 className="trip-country">{title}</h3>
            {subtitle && <p className="trip-city">{subtitle}</p>}
          </div>

          <div className="trip-details">
            <div className="trip-row">
              <FiCalendar className="trip-meta-icon" />
              <span>{formatDate(trip.startDate)}-{formatDate(trip.endDate)}</span>
            </div>

            <div className="trip-row">
              <FiUser className="trip-meta-icon" />
              <span>{trip.travelers}</span>
            </div>
          </div>

          {(canUpdateTrip || canDeleteTrip) && (
            <div className="trip-actions">
              {canUpdateTrip && (
                <button
                  className="action-btn edit-btn"
                  onClick={handleEditClick}
                  title="Edit"
                  type="button"
                >
                  ✎
                </button>
              )}

              {canDeleteTrip && (
                <button
                  className="action-btn delete-btn"
                  onClick={handleDeleteClick}
                  title="Delete"
                  type="button"
                >
                  🗑
                </button>
              )}
            </div>
          )}
        </div>

        <div className="trip-image-wrapper">
          <img src={tripImage} alt={title} className="trip-image" />
        </div>
      </div>
    </article>
  );
}

export default TripCard;
