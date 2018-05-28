let modal = document.getElementById('modal');

window.onclick = function(e) {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
}