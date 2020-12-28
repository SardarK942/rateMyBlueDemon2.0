/* 
This Event page basically take the teachersname from rate my proffessor and using the URL searches 
that teachers name up and scrape the curcuial info of teacher and then send that info to the popup.html
*/
const SEARCHQUERY = "ul.listings > li:first-child > a"
const COMMENTQUERY = ".Comments__StyledComments-dzzyvm-0.dvnRbr"
const RATINGQUERY = ".RatingValue__Numerator-qw8sqy-2.gxuTRq"
const FNAMEQUERY = ".NameTitle__Name-dowf0z-0.jeLOXk >span:first-child"
const LNAMEQUERY = ".NameTitle__LastNameWrapper-dowf0z-2.glXOHH"
const WTAQUERY = ".FeedbackItem__FeedbackNumber-uof32n-1.bGrrmf"
const LODQUERY = ".FeedbackItem__FeedbackNumber-uof32n-1.bGrrmf"
const STYLE = `
    div.extensionInjectionWindow{
        position: fixed;
        height: 600px;
        width: 300px;
        right: 10px;
        top: 200px;
        padding: 30px 20px;
        background-color: #eeeeee;
        border-radius: 10px;
        box-shadow: 2px 2px 5px #ddd;
        overflow: auto;
        z-index:1000;
    }
    #extensionInjectionContent h2{
        margin: 20px 0;
        font-size: 26px;
        text-aling: center;
        font-weight: bold;
    }
    #extensionInjectionContent h4{
        margin: 5px 0;
        font-size: 18px;
    }
`

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        console.log("inject")
        chrome.tabs.executeScript(tabId, {
            file: 'content.js'
        });
    }
})

chrome.runtime.onMessage.addListener(receiver);
function receiver(request, sender, sendResponse){
    const tabid = sender.tab.id
    removeInjection(tabid)
    injectTemplate(tabid)
    const nameList = request.text.map(function(name){
        return name.replace(/\s/g,"%20")
    })
    const resultList = nameList.map(function(name){
        const searchlink = "https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=DePaul+university&queryoption=HEADER&query=" + name + "&facetSearch=true";
        getLink(searchlink).then(link=>{
            if(link && link.length){
                const resultlink = `https://www.ratemyprofessors.com${link}`
                getResult(resultlink).then(result=>{
                    console.log(result)
                    injectResult(result,tabid)
                })
            }
        })
    })
    
}
//retrieve professor page link by scraping search page
function getLink(URL){
    return new Promise((resolve, reject)=>{
        let xhr = new XMLHttpRequest();
        console.log(URL)
        xhr.open("GET", URL, true);
        xhr.send();
        xhr.onreadystatechange = function() { // Call a function when the state changes.
            if (this.readyState === XMLHttpRequest.DONE ) {
                var parser = new DOMParser();
                var htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
                console.log(htmlDoc.querySelector(SEARCHQUERY))
                resolve(htmlDoc.querySelector(SEARCHQUERY) ? htmlDoc.querySelector(SEARCHQUERY).getAttribute("href") : null)
            }
        }
    })
    
}
//retrieve professor info link by scraping professor page
function getResult(URL){
    return new Promise((resolve, reject)=>{
        let xhr = new XMLHttpRequest();
        console.log(URL)
        xhr.open("GET", URL, true);
        xhr.send();
        xhr.onreadystatechange = function() { // Call a function when the state changes.
            if (this.readyState === XMLHttpRequest.DONE ) {
                var parser = new DOMParser();
                var htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
                const result = {
                    profTopComment : DOMtoString(htmlDoc.querySelector(COMMENTQUERY)),
                    profRating : DOMtoString(htmlDoc.querySelector(RATINGQUERY)),
                    profFirstName : DOMtoString(htmlDoc.querySelector(FNAMEQUERY)),
                    profLastname : DOMtoString(htmlDoc.querySelector(LNAMEQUERY)).split(" ")[0],
                    percentWTA : DOMtoString(htmlDoc.querySelector(WTAQUERY)),
                    levelOfDiff : DOMtoString(htmlDoc.querySelector(LODQUERY))
                }
                resolve(result)
            }
        }
    })
}
//helper function
function DOMtoString(document_root) {
    if (!document_root){
        return null
    }
    var html = '',
        node = document_root.firstChild;
    while (node) {
        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            html += node.outerHTML;
            break;
        case Node.TEXT_NODE:
            html += node.nodeValue;
            break;
        }
        node = node.nextSibling;
    }
    return html;
}
//construct html for each professor
function constructHTML(result){
    if( result){
        return `
        <div id="extensionInjectionContent">
            <div id="extenstionInjectMessage">
                <h2>${result.profFirstName} ${result.profLastname}</h2>
                <h4>profRating:</h4>
                <p">${result.profRating}</p>
                <h4>percentWTA:</h4>
                <p">${result.percentWTA}</p>
                <h4>levelOfDiff:</h4>
                <p">${result.levelOfDiff}</p>
                <h4>profTopComment:</h4>
                <p">${result.profTopComment}</p>
            </div>
        </div>
        `
    }
    return `
    <div id="extensionInjectionContent">
        <h2>Professor not found</h2>
    </div>
    `
}

//inject html to current page
function injectResult(result,tabid){
    const HTML = constructHTML(result)
    const code = `
    if (typeof node === 'undefined'){
        let node = document.querySelector("div.extensionInjectionWindow")
        node.innerHTML =\`${HTML}\` + node.innerHTML
    }else{
        node = document.querySelector("div.extensionInjectionWindow")
        node.innerHTML =\`${HTML}\` + node.innerHTML
    }
    `
    chrome.tabs.executeScript(null, {
        code: code
      }, function() {
    if (chrome.runtime.lastError) {
        console.log('There was an error injecting getLoading script : \n' + chrome.runtime.lastError.message);
        }
    });
}
//inject html result container to current page
function injectTemplate(tabid){
    const code = `
    if (typeof node === 'undefined'){
        let node = document.createElement("div")
        node.classList.add("extensionInjectionWindow");
        let style = document.createElement("style")
        style.innerHTML = \`${STYLE}\`
        document.querySelector("body").appendChild(node)
        document.querySelector("body").appendChild(style)
    }else{
        node = document.createElement("div")
        node.classList.add("extensionInjectionWindow");
        let style = document.createElement("style")
        style.innerHTML = \`${STYLE}\`
        document.querySelector("body").appendChild(node)
        document.querySelector("body").appendChild(style)
    }
    `
    chrome.tabs.executeScript(null, {
        code: code
      }, function() {
    if (chrome.runtime.lastError) {
        console.log('There was an error injecting getLoading script : \n' + chrome.runtime.lastError.message);
        }
    });
}
//inject injection if any
function removeInjection(tabid){
    const code = `
    if (typeof element === 'undefined'){
        let element = document.querySelector("div.extensionInjectionWindow")
        console.log(element)
        if (element){
            element.parentNode.removeChild(element);
        }
    }else{
        element = document.getElementById("extensionInjectionWindow")
        console.log(element)
        if (element){
            element.parentNode.removeChild(element);
        }
    }
    `
    chrome.tabs.executeScript(null, {
        code: code
      }, function() {
        if (chrome.runtime.lastError) {
          console.log('There was an error injecting getLoading script : \n' + chrome.runtime.lastError.message);
        }
      });
}