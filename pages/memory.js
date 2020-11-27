import React, { useState, useEffect } from 'react';
import { useLocalStore, useObserver } from 'mobx-react';
import Head from 'next/head';
import Layout from '../components/Layout';
import nextCookies from 'next-cookies';
import { isSessionTokenValid } from '../util/auth';
import { getUserBySessionToken } from '../util/database';
import { createMemoryCards } from '../util/functions';
import { colors } from '../assets/colors';
import { css } from '@emotion/core';
import countries from '../countries.js';

const memoryStyles = css`
  .outer-wrapper {
    width: 80vw;
    max-width: 900px;
    height: 100%;
    margin-top: 100px;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    line-height: 2;
  }

  .memory-area {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    column-gap: 1em;
    row-gap: 1em;
    margin: 0.5em;
    margin-bottom: 4em;
  }
  .memory-card {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 120px;
    width: 120px;
    border: 1px solid black;
    text-align: center;

    border-radius: 5px;

    position: relative;
    @media (max-width: 500px) {
      width: 20vw;
      height: 20vw;
      font-size: 0.4em;
    }


  }
  .memory-area div {
  }
  @media (hover: none) {
  button:hover {

    background-color: ${colors.primary};

  }

  .memory-area button,
  .settings {
    border-radius: 5px;
    border: none;
    background-color: ${colors.primary};
    text-shadow: 1px 1px #000000;
    color: white;
    font-family: monospace;
    width: 100%;
    height: 100%;
    box-shadow: 2pt 2pt ${colors.black};
    @media (max-width: 500px) {

      font-size: 11px;
    }
  }

  .settings,
  .restart {
    width: 200px;
    margin: 0.5em;
    text-shadow: none;
    box-shadow: none;
    padding: 0.5em;
  }
  .settings:hover {
    background-color: ${colors.primaryLight};
  }

  .restart {
    margin-left: 0;
    box-shadow: none;
  }

  .memory-area button:hover {
    background-color: ${colors.primaryLight};
  }
  .memory-area button .backside {
  }
  button img {
    max-width: 80%;
  }

  .hidden {
    opacity: 0;
  }
`;

const StoreContext = React.createContext();

const StoreProvider = ({ children }) => {
  const store = useLocalStore(() => ({
    cards: createMemoryCards(countries, 8),

    flipCard: (flippedCard) => {
      // if 0 or 1 cards are visible, make the clicked one additionally visible
      if (
        store.cards.filter((c) => c.visible === true).length === 0 ||
        store.cards.filter((c) => c.visible === true).length === 1
      ) {
        store.cards.replace(
          store.cards.map((ca) => {
            return ca.id !== flippedCard.id ? ca : { ...ca, visible: true };
          }),
        );
      }
      //if there is already one card visible and has the same pair ID as the flipped one -> set to solved
      if (
        store.cards.filter((c) => c.visible).length === 2 &&
        store.cards.filter((c) => c.visible)[0].pairId ===
          store.cards.filter((c) => c.visible)[1].pairId
      ) {
        store.cards.replace(
          store.cards.map((ca) => {
            return ca.pairId !== flippedCard.pairId
              ? ca
              : { ...ca, solved: true, visible: false };
          }),
        );
      }
      // if two cards a already visible, make all cards invisible except the just clicked one
      if (store.cards.filter((c) => c.visible === true).length === 2) {
        store.cards.replace(
          store.cards.map((ca) => {
            return ca.id !== flippedCard.id
              ? { ...ca, visible: false }
              : { ...ca, visible: true };
          }),
        );
      }
    },

    get solvedCards() {
      return store.cards.filter((card) => card.solved).length / 2;
    },
    restart: () => {
      store.cards.replace(createMemoryCards(countries, 8));
    },
  }));

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

const SolvedCards = () => {
  const store = React.useContext(StoreContext);
  return useObserver(() => <div>Solved: {store.solvedCards}</div>);
};

const MobXCards = ({ gameSetting }) => {
  const store = React.useContext(StoreContext);

  return useObserver(() => (
    <>
      {' '}
      {store.cards.map((card) => {
        return (
          <div className="memory-card">
            <button
              onClick={() => store.flipCard(card)}
              className={card.visible || card.solved ? 'front' : 'back'}
            >
              {!(card.visible || card.solved) ? (
                <div />
              ) : card.display === 'A' &&
                (gameSetting === 'Country - Capital' ||
                  gameSetting === 'Country - Flag') ? (
                <div>{card.name}</div>
              ) : card.display === 'A' && gameSetting === 'Capital - Flag' ? (
                <div>{card.capital}</div>
              ) : card.display === 'B' &&
                (gameSetting === 'Capital - Flag' ||
                  gameSetting === 'Country - Flag') ? (
                <img src={card.flag} alt=""></img>
              ) : (
                <div>{card.capital}</div>
              )}
            </button>
          </div>
        );
      })}
      <button className="restart" onClick={() => store.restart()}>
        Restart
      </button>
    </>
  ));
};

export default function Memory(props) {
  const [cards, setCards] = useState([]);
  const [score, setScore] = useState(0);
  const [gameSetting, setGameSetting] = useState('CountryVSCapital');

  const gameSettings = [
    'Country - Capital',
    'Country - Flag',
    'Capital - Flag',
  ];

  useEffect(() => {
    setCards(createMemoryCards(countries, 8));
    setScore(0);
  }, []);

  useEffect(() => {
    const visibleCards = cards.filter((c) => c.visible === true);
    if (
      visibleCards.length === 2 &&
      visibleCards[0].pairId === visibleCards[1].pairId
    ) {
      const newScore = score + 1;
      setScore(newScore);
      setCards(
        cards.map((ca) => {
          return ca.pairId === visibleCards[0].pairId
            ? { ...ca, solved: true, visible: false }
            : ca;
        }),
      );
    }
  }, [cards, score]);

  function handleCardClick(allCards, clickedCard) {
    // if already 2 cards are visible, flip all to invisible
    if (allCards.filter((c) => c.visible === true).length === 2) {
      setCards(
        cards.map((ca) => {
          return ca.id !== clickedCard.id
            ? { ...ca, visible: false }
            : { ...ca, visible: true };
        }),
      );
    } else
      setCards(
        cards.map((ca) => {
          return ca.id !== clickedCard.id ? ca : { ...ca, visible: true };
        }),
      );
  }

  function Cards({ cards, handleCardClick }) {
    return (
      <>
        {' '}
        {cards.map((card) => {
          return (
            <div className="memory-card">
              <button
                onClick={() => handleCardClick(cards, card)}
                className={card.visible || card.solved ? 'front' : 'back'}
              >
                {!(card.visible || card.solved) ? (
                  <div />
                ) : card.display === 'A' &&
                  (gameSetting === 'Country - Capital' ||
                    gameSetting === 'Country - Flag') ? (
                  <div>{card.name}</div>
                ) : card.display === 'A' && gameSetting === 'Capital - Flag' ? (
                  <div>{card.capital}</div>
                ) : card.display === 'B' &&
                  (gameSetting === 'Capital - Flag' ||
                    gameSetting === 'Country - Flag') ? (
                  <img src={card.flag} alt="" />
                ) : (
                  <div>{card.capital}</div>
                )}
              </button>
            </div>
          );
        })}
        <button
          className="restart"
          onClick={() => setCards(createMemoryCards(countries, 8))}
        >
          Restart
        </button>
      </>
    );
  }
  return (
    <StoreProvider>
      <Layout loggedIn={props.loggedIn}>
        <Head>
          <title>GeoQuiz - Memory</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div css={memoryStyles}>
          <div className="outer-wrapper">
            {gameSettings.map((setting) => {
              return (
                <button
                  className="settings"
                  onClick={() => setGameSetting(setting)}
                >
                  {setting}
                </button>
              );
            })}
            <div>Solved: {score}</div>
            <div className="memory-area">
              <Cards cards={cards} handleCardClick={handleCardClick} />
            </div>

            <SolvedCards />
            <div className="memory-area">
              <MobXCards gameSetting={gameSetting} />
            </div>
          </div>
        </div>
      </Layout>
    </StoreProvider>
  );
}

export async function getServerSideProps(context) {
  let { session: token } = nextCookies(context) || null;
  const loggedIn = await isSessionTokenValid(token);
  const user = (await getUserBySessionToken(token)) || null;

  if (typeof token === 'undefined') {
    token = null;
  }
  return {
    props: { loggedIn: loggedIn, user: user },
  };
}
