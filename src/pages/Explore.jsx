import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import '../styles/Explore.css';

import australiaImg from '../assets/australia.jpg';
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
import { API_BASE_URL } from '../config/api';
const colorPalette = [
  '#5e8fd6',
  '#93ab7c',
  '#e7bb43',
  '#64b86a',
  '#7daea0',
  '#8fb7e8',
  '#a7c395',
  '#6e9c91',
  '#b7c9a8',
  '#c7c7c7'
];

const countryImages = {
  australia: australiaImg,
  austria: austriaImg,
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
  usa: usaImg,
  'united kingdom': ukImg,
  'united states': usaImg,
  'united states of america': usaImg
};

function Explore({ trips, setTrips, isOnline }) {
  const [selectedChart, setSelectedChart] = useState('bar');
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('newTrip', (trip) => {
      console.log('NEW TRIP IN EXPLORE:', trip);

      setTrips((prevTrips) => {
        const alreadyExists = prevTrips.some((existingTrip) => existingTrip.id === trip.id);

        if (alreadyExists) {
          return prevTrips;
        }

        return [...prevTrips, trip];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [setTrips]);

  useEffect(() => {
    if (!showOverlay) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [showOverlay]);

  const handleChartChange = (chartType) => {
    if (chartType === selectedChart) {
      return;
    }

    setSelectedChart(chartType);
    setShowOverlay(true);
  };

  const formatMonthYear = (dateValue) => {
    if (!dateValue) {
      return '—';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getTripCountry = (trip) => {
    return (
      trip.country ||
      trip.destination ||
      trip.location ||
      trip.place ||
      trip.city ||
      'Unknown'
    );
  };

  const getTripRelevantDate = (trip) => {
    return trip.endDate || trip.startDate || null;
  };

  const getCountryImage = (countryName) => {
    if (!countryName) {
      return null;
    }

    const normalized = countryName.trim().toLowerCase();
    return countryImages[normalized] || null;
  };

  const destinationData = useMemo(() => {
    const grouped = {};

    trips.forEach((trip) => {
      const country = getTripCountry(trip);
      const relevantDate = getTripRelevantDate(trip);

      if (!grouped[country]) {
        grouped[country] = {
          country,
          trips: 0,
          lastVisitDate: relevantDate ? new Date(relevantDate) : null
        };
      }

      grouped[country].trips += 1;

      if (relevantDate) {
        const currentTripDate = new Date(relevantDate);

        if (
          !Number.isNaN(currentTripDate.getTime()) &&
          (
            grouped[country].lastVisitDate === null ||
            currentTripDate > grouped[country].lastVisitDate
          )
        ) {
          grouped[country].lastVisitDate = currentTripDate;
        }
      }
    });

    return Object.values(grouped).map((item, index) => ({
      id: index + 1,
      country: item.country,
      trips: item.trips,
      lastVisit: item.lastVisitDate ? formatMonthYear(item.lastVisitDate) : '—',
      lastVisitDate: item.lastVisitDate,
      color: colorPalette[index % colorPalette.length]
    }));
  }, [trips]);

  const sortedDestinations = useMemo(() => {
    return [...destinationData].sort((a, b) => {
      if (b.trips !== a.trips) {
        return b.trips - a.trips;
      }

      const dateA = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
      const dateB = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;

      return dateB - dateA;
    });
  }, [destinationData]);

  const totalTrips = useMemo(() => {
    return sortedDestinations.reduce((sum, item) => sum + item.trips, 0);
  }, [sortedDestinations]);

  const maxTrips = useMemo(() => {
    if (sortedDestinations.length === 0) {
      return 1;
    }

    return Math.max(...sortedDestinations.map((item) => item.trips), 1);
  }, [sortedDestinations]);

  const topFive = useMemo(() => {
    return sortedDestinations.slice(0, 5);
  }, [sortedDestinations]);

  const exploredPercentage = useMemo(() => {
    const totalCountriesInWorld = 195;
    const visitedCountries = sortedDestinations.length;

    if (visitedCountries === 0) {
      return 0;
    }

    return Math.max(1, Math.round((visitedCountries / totalCountriesInWorld) * 100));
  }, [sortedDestinations]);

  const pieSegments = useMemo(() => {
    if (totalTrips === 0) {
      return [];
    }

    const topFiveTrips = topFive.reduce((sum, item) => sum + item.trips, 0);
    const otherTrips = totalTrips - topFiveTrips;

    const segments = topFive.map((item) => ({
      label: item.country,
      value: item.trips,
      color: item.color
    }));

    if (otherTrips > 0) {
      segments.push({
        label: 'Other',
        value: otherTrips,
        color: '#d3d3d3'
      });
    }

    let cumulative = 0;

    return segments.map((segment) => {
      const start = (cumulative / totalTrips) * 360;
      cumulative += segment.value;
      const end = (cumulative / totalTrips) * 360;

      return {
        ...segment,
        start,
        end
      };
    });
  }, [topFive, totalTrips]);

  const conicGradient = useMemo(() => {
    if (!pieSegments.length) {
      return '#d9d9d9 0deg 360deg';
    }

    return pieSegments
      .map(
        (segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`
      )
      .join(', ');
  }, [pieSegments]);

  return (
    <div className="explore-layout">
      <Sidebar />

      <main className="explore-main">
        <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? 'Online' : 'Offline mode'}
        </div>

        <div className="explore-top-row">
          <section className="explore-card progress-card">
            <h2>You’ve explored</h2>

            <div className="progress-circle-wrapper">
              <div
                className="progress-circle"
                style={{
                  background: `conic-gradient(#7f9f8e 0deg ${exploredPercentage * 3.6}deg, #d9d9d9 ${exploredPercentage * 3.6}deg 360deg)`
                }}
              >
                <span>{exploredPercentage}%</span>
              </div>
            </div>

            <p>of the world</p>
          </section>

          <section className="explore-card favorites-card">
            <h2>Favorite Destinations</h2>

            <div className="favorites-list">
              {topFive.length > 0 ? (
                topFive.map((item, index) => {
                  const countryImage = getCountryImage(item.country);

                  return (
                    <div className="favorite-row" key={item.id}>
                      <div className="favorite-left">
                        <span className="favorite-rank">{index + 1}.</span>

                        {countryImage ? (
                          <img
                            src={countryImage}
                            alt={item.country}
                            className="favorite-country-image"
                          />
                        ) : (
                          <div className="favorite-country-image favorite-country-placeholder" />
                        )}

                        <span className="favorite-country">{item.country}</span>
                      </div>

                      <span className="favorite-count">{item.trips} trips</span>
                    </div>
                  );
                })
              ) : (
                <div className="empty-explore-state">No destinations yet.</div>
              )}
            </div>
          </section>
        </div>

        <section className="explore-card destinations-card">
          <div className="destinations-header">
            <h2>Your Travel Destinations</h2>

            <div className="view-switch">
              <label className="switch-option">
                <input
                  type="checkbox"
                  checked={selectedChart === 'bar'}
                  onChange={() => handleChartChange('bar')}
                />
                <span className="custom-check"></span>
                Bar
              </label>

              <label className="switch-option">
                <input
                  type="checkbox"
                  checked={selectedChart === 'pie'}
                  onChange={() => handleChartChange('pie')}
                />
                <span className="custom-check"></span>
                Pie
              </label>
            </div>
          </div>

          <div className="destinations-content">
            {sortedDestinations.length === 0 ? (
              <div className="placeholder-view">No trip data available yet.</div>
            ) : (
              <div className="parallel-views">
                <div className="parallel-panel table-panel">
                  <div className="table-view">
                    <table className="destinations-table">
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th>Number of trips</th>
                          <th>Last visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedDestinations.map((item) => (
                          <tr key={item.id}>
                            <td>{item.country}</td>
                            <td>{item.trips}</td>
                            <td>{item.lastVisit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="parallel-panel chart-panel">
                  <div className="chart-wrapper">
                    {showOverlay && (
                      <div className="chart-overlay">
                        {selectedChart === 'bar' ? 'Bar chart' : 'Pie chart'}
                      </div>
                    )}

                    {selectedChart === 'bar' && (
                      <div className="bar-view chart-animate">
                        <div className="bar-chart">
                          {sortedDestinations.map((item) => (
                            <div className="bar-row" key={item.id}>
                              <div className="bar-label">{item.country}</div>

                              <div className="bar-track">
                                <div
                                  className="bar-fill"
                                  style={{ width: `${(item.trips / maxTrips) * 100}%` }}
                                />
                              </div>

                              <div className="bar-value">{item.trips}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedChart === 'pie' && (
                      <div className="pie-view chart-animate">
                        <div className="pie-legend">
                          {pieSegments.map((segment) => (
                            <div className="legend-row" key={segment.label}>
                              <span
                                className="legend-color"
                                style={{ backgroundColor: segment.color }}
                              />
                              <span className="legend-text">{segment.label}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pie-chart-side">
                          <div
                            className="pie-chart-ring"
                            style={{
                              background: `conic-gradient(${conicGradient})`
                            }}
                          >
                            <div className="pie-hole">
                              <div className="pie-center-text">
                                <span className="pie-center-number">{totalTrips}</span>
                                <span className="pie-center-label">trips</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Explore;
