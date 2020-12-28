

function getProfessor() {
    const professorList = Array.from(document.querySelectorAll("table td.INSTRUCTOR span")).map(function(node){return node.innerHTML})
    // console.log(professorList)
    if (professorList.length>0){
        let message = {
           text: professorList 
        }
        chrome.runtime.sendMessage(null, message);
    }
}

//wait for the table load for 2 seconds before scraping the page
setTimeout(()=>{
    getProfessor()
},2000) 

