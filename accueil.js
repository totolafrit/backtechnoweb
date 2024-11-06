let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

let newsSlideIndex = 1;
showNewsSlides(newsSlideIndex);

function plusNewsSlides(n) {
    showNewsSlides(newsSlideIndex += n);
}

function currentNewsSlide(n) {
    showNewsSlides(newsSlideIndex = n);
}

function showNewsSlides(n) {
    let i;
    let slides = document.getElementsByClassName("newsSlides");
    let dots = document.getElementsByClassName("news-dot");
    if (n > slides.length) { newsSlideIndex = 1 }
    if (n < 1) { newsSlideIndex = slides.length }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[newsSlideIndex - 1].style.display = "block";
    dots[newsSlideIndex - 1].className += " active";
}
