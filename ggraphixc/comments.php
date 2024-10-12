<?php

if (isset($_POST["name"]) && isset($_POST["comment"])) {
    $Name = htmlspecialchars($_POST["name"]);
    $Comment = htmlspecialchars($_POST["comment"]);
    
    // Capture the rating value and ensure it's within 1-5 range
    $Rating = isset($_POST["rating"]) && is_numeric($_POST["rating"]) && $_POST["rating"] > 0 ? (int)$_POST["rating"] : 0;

    // Convert rating number into stars (for display)
    $stars = '';
    for ($i = 1; $i <= 5; $i++) {
        if ($i <= $Rating) {
            $stars .= "<i class='ri-star-fill' style='color: orange;'></i>";  // Filled star for rating
        } else {
            $stars .= "<i class='ri-star-line' style='color: gold;'></i>";  // Outline star for non-rated stars
        }
    }

    // Prepare the new comment with star rating
    $New_Comment = "<div class='post_comment'>
                        <div class='Nam_star'><strong>" . $Name . "</strong><div class='user-rating'>" . $stars . "</div></div>
                        <span>" . date("d/m/Y") . " | " . date("h:i A") . "</span>
                        <p>" . $Comment . "</p> 
                    </div>\n";

    // Append the new comment to the comments.txt file
    file_put_contents("comments.txt", $New_Comment . file_get_contents("comments.txt"));

    // Output the new comment (this will be returned as an AJAX response)
    echo $New_Comment;
}
