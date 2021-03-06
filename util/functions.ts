import { Country, Question, MemoryCard } from './types';

export function random(x: number) {
  // returns a random number between 0 and x-1
  return Math.floor(Math.random() * x);
}

export function createUniqueRandomIndexArray(
  length: number,
  indicesToChooseFrom: number,
) {
  const arr = [];
  while (arr.length < length) {
    const newRand = random(indicesToChooseFrom);
    if (arr.indexOf(newRand) === -1) {
      arr.push(newRand);
    }
  }
  return arr;
}

export function createQuestionArray(
  numberOfQ: number,
  answerPossibilities: number,
  allCountries: Country[],
  qCategory: string,
  aCategory: string,
  filterByRegion: string,
) {
  let filteredCountries;
  if (filterByRegion === 'World') {
    filteredCountries = allCountries;
  } else {
    filteredCountries = allCountries.filter(
      (country) => country.region === filterByRegion,
    );
  }
  const questionArray: Question[] = [];
  // create new questions
  for (let i = 0; i < numberOfQ; i++) {
    const randomCountryIndices = createUniqueRandomIndexArray(
      answerPossibilities,
      filteredCountries.length,
    );
    const sol = random(answerPossibilities);
    const indexOfSolution = randomCountryIndices[sol];
    let quizQuestion;
    switch (qCategory) {
      case 'name':
        quizQuestion = filteredCountries[indexOfSolution].name;
        break;
      case 'capital':
        quizQuestion = filteredCountries[indexOfSolution].capital;
        break;
      case 'flag':
        quizQuestion = filteredCountries[indexOfSolution].flag;
        break;
      default:
        quizQuestion = filteredCountries[indexOfSolution].name;
    }
    const newQuestion: Question = { question: quizQuestion, answerOptions: [] };
    // create answerOptions for each question
    for (let j = 0; j < randomCountryIndices.length; j++) {
      let quizAnswer;
      switch (aCategory) {
        case 'name':
          quizAnswer = filteredCountries[randomCountryIndices[j]].name;
          break;
        case 'capital':
          quizAnswer = filteredCountries[randomCountryIndices[j]].capital;
          break;
        case 'flag':
          quizAnswer = filteredCountries[randomCountryIndices[j]].flag;
          break;
        default:
          quizAnswer = filteredCountries[randomCountryIndices[j]].name;
      }
      if (j === sol) {
        //for the correct answer
        newQuestion.answerOptions.push({
          answer: quizAnswer,
          isCorrect: true,
        });
      } else {
        //for the wrong answers
        newQuestion.answerOptions.push({
          answer: quizAnswer,
          isCorrect: false,
        });
      }
    }
    questionArray.push(newQuestion);
  }
  return questionArray;
}

export async function updateScoresRequest(
  userId: number,
  answeredQuestions: number,
  correctQuestions: number,
  categoryAnswer: string,
  region: string,
  token: string,
) {
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      answeredQuestions: answeredQuestions,
      correctQuestions: correctQuestions,
      categoryAnswer,
      region,
      token,
    }),
  });
  const { success } = await response.json();

  let errorMessage = '';
  if (!success) {
    errorMessage = 'Updating Scores failed';
  } else {
    errorMessage = '';
  }
}

export function createMemoryCards(input: Country[], numberOfPairs: number) {
  function getRandomSubsetOfArray(array: Country[], n: number) {
    const subset = [];
    while (subset.length < n) {
      const randomIndex = Math.floor(Math.random() * (array.length - 1));
      if (subset.indexOf(array[randomIndex]) === -1) {
        subset.push(array[randomIndex]);
      }
    }

    return subset;
  }
  function concatArrays<T>(array1: Array<T>, array2: Array<T>): T[] {
    return array1.concat(array2);
  }
  function addPairIdToCards(array: Country[]) {
    return array.map((card, index) => {
      return { ...card, pairId: index };
    });
  }
  function addDisplayAndSolvedToCards(array: Country[]) {
    return array.map((card, index) => {
      return { ...card, visible: false, solved: false };
    });
  }
  function addDisplayA(array: Country[]) {
    return array.map((card) => {
      return { ...card, display: 'A' };
    });
  }
  function addDisplayB(array: Country[]) {
    return array.map((card) => {
      return { ...card, display: 'B' };
    });
  }
  function addIdToCards(array: Country[]) {
    return array.map((card, index) => {
      return { ...card, id: index };
    });
  }
  function shuffle<T>(array: T[]) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const newIndex = Math.floor(Math.random() * (i + 1));
      const oldValue = shuffledArray[newIndex];
      // puts the card at i in the position of the new index
      shuffledArray[newIndex] = shuffledArray[i];
      // puts the the card that was at the newIndex in the position of I
      shuffledArray[i] = oldValue;
    }
    return shuffledArray;
  }
  const newCardSet = getRandomSubsetOfArray(input, numberOfPairs);
  const newCardSetWithPairId = addPairIdToCards(newCardSet);
  const newCardSetWithDisplay = addDisplayAndSolvedToCards(
    newCardSetWithPairId,
  );
  const cardSetA = addDisplayA(newCardSetWithDisplay);
  const cardSetB = addDisplayB(newCardSetWithDisplay);
  const cardSetAndB = concatArrays(cardSetA, cardSetB);
  const newCardSetWithIds = addIdToCards(cardSetAndB);
  const cardSetAndBShuffled = shuffle(newCardSetWithIds);
  return cardSetAndBShuffled;
}
