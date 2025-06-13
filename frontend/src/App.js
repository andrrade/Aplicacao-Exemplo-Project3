import React, { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [color, setColor] = useState("#ffffff");
  const [catImage, setCatImage] = useState("");
  const [randomPhoto, setRandomPhoto] = useState("");
  const [time, setTime] = useState("");
  const [joke, setJoke] = useState("");
  const [scareImage, setScareImage] = useState("");
  const [lookalikeImage, setLookalikeImage] = useState("");
  const [loading, setLoading] = useState(true);

  const backendUrl = "http://localhost:30001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colorRes, catRes, photoRes, timeRes] = await Promise.all([
          fetch(`${backendUrl}/color`),
          fetch(`${backendUrl}/cat`),
          fetch(`${backendUrl}/random-photo`),
          fetch(`${backendUrl}/time`),
        ]);

        const colorData = await colorRes.json();
        const catData = await catRes.json();
        const photoData = await photoRes.json();
        const timeData = await timeRes.json();

        setColor(colorData.color || "#ffffff");
        setCatImage(catData.cat_image_url);
        setRandomPhoto(photoData.random_photo_url);
        setTime(timeData.current_time);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  async function handleJoke() {
    try {
      const res = await fetch(`${backendUrl}/joke`);
      const data = await res.json();
      setJoke(data.joke || "Nenhuma piada encontrada.");
    } catch (error) {
      setJoke("Erro ao carregar piada.");
    }
  }

  async function handleScare() {
    try {
      const res = await fetch(`${backendUrl}/scare`);
      const data = await res.json();
      setScareImage(data.scare_image_url);
    } catch (error) {
      console.error("Erro ao carregar susto:", error);
    }
  }

  async function handleLookalike() {
    try {
      const res = await fetch(`${backendUrl}/lookalike`);
      const data = await res.json();
      setLookalikeImage(data.lookalike_image_url);
    } catch (error) {
      console.error("Erro ao carregar sósia:", error);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando experiência...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="container">
        <header className="header">
          <h1>Projeto Frontend</h1>
          <p className="subtitle">Teste v1.5</p>
        </header>

        <div className="grid">
          <section className="section cat-section">
            <h2>
              <span className="section-icon">🐱</span>
              Gatos
            </h2>
            <div className="section-content">
              {catImage && (
                <div className="image-container">
                  <img src={catImage} alt="Gato fofo" />
                </div>
              )}
            </div>
          </section>

          <section className="section photo-section">
            <h2>
              <span className="section-icon">📸</span>
              Fotos aleatórias
            </h2>
            <div className="section-content">
              {randomPhoto && (
                <div className="image-container">
                  <img src={randomPhoto} alt="Foto aleatória" />
                </div>
              )}
            </div>
          </section>

          <section className="section color-section">
            <h2>
              <span className="section-icon">🎨</span>
              Cor
            </h2>
            <div className="section-content">
              <div className="color-display" style={{ backgroundColor: color }}>
                {color}
              </div>
            </div>
          </section>

          <section className="section time-section">
            <h2>
              <span className="section-icon">🕐</span>
              Agora
            </h2>
            <div className="section-content">
              <div className="time-display">{time}</div>
            </div>
          </section>

          <section className="section joke-section">
            <h2>
              <span className="section-icon">😄</span>
              Humor
            </h2>
            <div className="section-content">
              <button className="button" onClick={handleJoke}>
                Gerar Piada
              </button>
              {joke && <div className="joke-text">{joke}</div>}
            </div>
          </section>

          <section className="section scare-section">
            <h2>
              <span className="section-icon">👻</span>
              Susto
            </h2>
            <div className="section-content">
              <button className="button" onClick={handleScare}>
                Se Prepare
              </button>
              {scareImage && (
                <div className="image-container">
                  <img src={scareImage} alt="Imagem de susto" />
                </div>
              )}
            </div>
          </section>

          <section className="section lookalike-section">
            <h2>
              <span className="section-icon">👤</span>
              Sósia
            </h2>
            <div className="section-content">
              <button className="button" onClick={handleLookalike}>
                Descobrir
              </button>
              {lookalikeImage && (
                <div className="image-container">
                  <img src={lookalikeImage} alt="Imagem de sósia" />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
