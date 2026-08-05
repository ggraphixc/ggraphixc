$(document).ready(function() {
    // Handle form submission using AJAX
    $('#commentForm').on('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        // Collect the form data
        var formData = {
            name: $('#name').val(),
            comment: $('#comment').val(),
            rating: $('#ratingValue').val() // Ensure the key is 'rating'
        };

        // Hide confirmation message and show loading spinner
        $('#confirmationMessage').hide();
        $('#loadingSpinner').show();

        // Send the form data via AJAX to comments.php
        $.ajax({
            type: 'POST',
            url: 'comments.php', // The backend file handling the form submission
            data: formData,
            success: function(response) {
                // Hide loading spinner
                $('#loadingSpinner').hide();

                // Append the new comment to the comment area
                $('#comment_area').prepend(response);

                // Clear the form fields
                $('#name').val('');
                $('#comment').val('');
                $('#ratingValue').val('0'); // Reset to 0

                // Reset star ratings and hide checkmarks
                clearRatingAndCheckmarks();

                // Show confirmation message
                $('#confirmationMessage').fadeIn().delay(7000).fadeOut(); // Show for 3 seconds
            },
            error: function(xhr, status, error) {
                // Hide loading spinner
                $('#loadingSpinner').hide();

                // Handle errors
                console.error('AJAX Error:', status, error);
                alert('An error occurred while submitting your comment. Please try again.');
            }
        });
    });

    // Handle star click events
    $('.star-rating i').on('click', function() {
        var rating = $(this).data('value');
        $('#ratingValue').val(rating);

        // Highlight selected stars
        $('.star-rating i').each(function(index) {
            if (index < rating) {
                $(this).removeClass('ri-star-line').addClass('ri-star-fill');
            } else {
                $(this).removeClass('ri-star-fill').addClass('ri-star-line');
            }
        });
    });

    // Clear stars and checkmarks
    function clearRatingAndCheckmarks() {
        $('#ratingValue').val('0');
        $('.star-rating i').removeClass('ri-star-fill').addClass('ri-star-line');
        $('#nameIcon').css('opacity', '0');
        $('#commentIcon').css('opacity', '0');
    }
});





const nameInput = document.getElementById('name');
const commentInput = document.getElementById('comment');
const nameIcon = document.getElementById('nameIcon');
const commentIcon = document.getElementById('commentIcon');
const commentForm = document.getElementById('commentForm');

function toggleIconOnFocusOut(inputField, icon) {
    inputField.addEventListener('blur', () => { // Changed from 'focusout' to 'blur'
        if (inputField.value.trim() !== '') {
            icon.style.opacity = '1'; // Show the icon if the input has text
        } else {
            icon.style.opacity = '0'; // Hide the icon if input is empty
        }
    });
}

// Function to hide the icon when the user starts typing again
function hideIconOnTyping(inputField, icon) {
    inputField.addEventListener('input', () => {
        icon.style.opacity = '0'; // Hide icon while the user is typing
    });
}

toggleIconOnFocusOut(nameInput, nameIcon);
toggleIconOnFocusOut(commentInput, commentIcon);

// Hide icons while typing
hideIconOnTyping(nameInput, nameIcon);
hideIconOnTyping(commentInput, commentIcon);