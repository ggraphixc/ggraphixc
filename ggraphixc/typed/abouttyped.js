
const dynamicText = [
    "are designer!", 
    "Design with Meaning.", 
    "Create Memorable Experiences.",
    "Help Your Brand Grow." ,
    "Bring Creativity to Life.",
    "Build Visual Stories.",
    "Design for Real Impact.",
    "Move Ideas Forward." 
  ];
  
  let partIndex = 0;    // Which part of the text is currently being typed
  let charIndex = 0;    // Which character in the text is currently being typed
  const typingSpeed = 80;  // Speed in milliseconds for typing each letter
  const erasingSpeed = 50;  // Speed for erasing
  const delayBetweenPhrases = 3000;  // Delay between phrases after typing
  const delayAfterErasing = 1000;    // Delay after erasing before typing again
  
  const dynamicTextElement = document.getElementById('aboutext');

  function type() {
    if (charIndex < dynamicText[partIndex].length) {
      dynamicTextElement.innerHTML += dynamicText[partIndex].charAt(charIndex);
      charIndex++;
      setTimeout(type, typingSpeed);
    } else {
      setTimeout(erase, delayBetweenPhrases); // Wait before starting to erase
    }
  }

  function erase() {
    if (charIndex > 0) {
      dynamicTextElement.innerHTML = dynamicText[partIndex].substring(0, charIndex - 1);
      charIndex--;
      setTimeout(erase, erasingSpeed);
    } else {
      partIndex = (partIndex + 1) % dynamicText.length; // Move to the next phrase
      setTimeout(type, delayAfterErasing); // Wait before starting to type the next phrase
    }
  }

  // Start the typing effect when the page loads
  window.onload = type;

