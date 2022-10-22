// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 * Returns array of category ids
 * API seems to return a random but clustered (around ID)
 * set of categories. Offset is randomized to achieve a
 * more fully randomized result.
 */
async function getCategoryIds(numCategories) {
    const random = Math.floor(Math.random() * 20000);
    const getCategories = await axios.get('https://jservice.io/api/categories', { params: { count: numCategories, offset: random } })
    return getCategories.data;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catTitle, catId) {
    const category = await axios.get(`https://jservice.io/api/clues?category=${catId}`);
    if (category.data.length < 5) return false; // Rejects categories with less than 5 clues
    while (category.data.length > 5) { // Reduce to a random selection of 5 clues if the category has more than 5
        const random = Math.floor(Math.random() * category.data.length);
        category.data.splice(random, 1);
    }
    const clueArray = [];
    for (let i = 0; i < 5; i++) { // Fills array with question/answer objects for category
        clueArray.push({ question: `${category.data[i].question}`, answer: `${category.data[i].answer}` });
    }
    const preparedCategory = { title: catTitle, clues: clueArray };
    return preparedCategory;
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
    const headerRow = document.createElement('tr');
    headerRow.setAttribute('id', 'header-row');
    for (let i = 0; i < 6; i++) {
        const newTd = document.createElement('td');
        newTd.innerText = categories[i].title;
        headerRow.append(newTd);
    }
    $('thead').append(headerRow);
    for (let i = 0; i < 5; i++) {
        const newTr = document.createElement('tr');
        newTr.setAttribute("id", `row-${i+1}`);
        for (let n = 0; n < 6; n++) {
            const newTd = document.createElement('td');
            newTd.setAttribute("id", `${n}-${i}`);
            newTd.classList.add('clue');
            newTd.innerText = `$${i+1}00`;
            newTr.append(newTd);
        }
        $('tbody').append(newTr);
    }

}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */
function handleClick(target) {
    const cat = target.id.slice(0, 1);
    const clu = target.id.slice(2);
    const clue = categories[cat].clues[clu];
    if (clue.showing) {
        if (clue.showing == 'question') {
            target.innerHTML = clue.answer.replace("\\", "");
            target.style.fontSize = '1.5vh';
            clue.showing = 'answer'
        } else {
            return
        }
    } else {
        target.innerHTML = clue.question;
        target.style.fontSize = '1vh';
        target.style.color = 'white';
        target.style['-webkit-text-stroke'] = '0';
        clue.showing = 'question';
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
    $('thead').empty();
    $('tbody').empty();
    categories = []
    $('#jeopardy').hide();
    $('#spin-container').show();
    $('#start').text('Loading');
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
    $('#spin-container').hide();
    $('#jeopardy').show();
    $('#start').text('New Game');
}

/** Start game:
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
async function setupAndStart() {
    const categoryResponse = await getCategoryIds(18);
    let i = 0;
    while (categories.length < 6) {
        const newCategory = await getCategory(categoryResponse[i].title, categoryResponse[i].id);
        if (newCategory) categories.push(newCategory);
        i++;
    }
    fillTable();
}

/** On click of start / restart button, set up game. */
$('#start').on('click', async function(e) {
    if (e.target = $('#start')) {
        showLoadingView();
        await setupAndStart();
        hideLoadingView();
    }
});

/** On page load, add event handler for clicking clues */
window.addEventListener('load', () => {
    $('#jeopardy').on('click', '.clue', function(e) {
        handleClick(e.target);
    })
});