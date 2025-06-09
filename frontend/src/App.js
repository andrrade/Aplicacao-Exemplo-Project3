import React, { useEffect, useState } from "react";

export default function App() {
  const [color, setColor] = useState("#fff");
  const [catImage, setCatImage] = useState("");
  const [randomPhoto, setRandomPhoto] = useState("");
  const [time, setTime] = useState("");
  const [joke, setJoke] = useState("");
  const [scareImage, setScareImage] = useState("");
  const [lookalikeImage, setLookalikeImage] = useState("");

  const backendUrl = "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`${backendUrl}/color`)
      .then((res) => res.json())
      .then((data) => setColor(data.color));
    fetch(`${backendUrl}/cat`)
      .then((res) => res.json())
      .then((data) => setCatImage(data.cat_image_url));
    fetch(`${backendUrl}/random-photo`)
      .then((res) => res.json())
      .then((data) => setRandomPhoto(data.random_photo_url));
    fetch(`${backendUrl}/time`)
      .then((res) => res.json())
      .then((data) => setTime(data.current_time));
  }, []);

  function handleJoke() {
    fetch(`${backendUrl}/joke`)
      .then((res) => res.json())
      .then((data) => setJoke(data.joke || "Nenhuma piada encontrada."));
  }

  function handleScare() {
    fetch(`${backendUrl}/scare`)
      .then((res) => res.json())
      .then((data) => setScareImage(data.scare_image_url));
  }

  function handleLookalike() {
    fetch(`${backendUrl}/lookalike`)
      .then((res) => res.json())
      .then((data) => setLookalikeImage(data.lookalike_image_url));
  }

  return (
    <div
      style={{
        backgroundColor: color,
        minHeight: "100vh",
        padding: "2rem",
        color: "#222",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Projeto Frontend React</h1>

      <section>
        <h2>Imagem Aleatória de Gato</h2>
        <img src={catImage} alt="Gato" style={{ maxWidth: "300px" }} />
      </section>

      <section>
        <h2>Foto Aleatória</h2>
        <img src={randomPhoto} alt="Foto aleatória" style={{ maxWidth: "300px" }} />
      </section>

      <section>
        <h2>Horário Atual</h2>
        <p>{time}</p>
      </section>

      <section>
        <h2>Piada</h2>
        <button onClick={handleJoke}>Mostrar Piada</button>
        <p>{joke}</p>
      </section>

      <section>
        <h2>Susto</h2>
        <button onClick={handleScare}>Mostrar Susto</button>
        {scareImage && <img src={scareImage} alt="Susto" style={{ maxWidth: "300px" }} />}
      </section>

      <section>
        <h2>Sósia</h2>
        <button onClick={handleLookalike}>Mostrar Sósia</button>
        {lookalikeImage && <img src={lookalikeImage} alt="Sósia" style={{ maxWidth: "300px" }} />}
      </section>
    </div>
  );
}
