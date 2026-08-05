<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Ggraphixc</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.2.0/remixicon.css" integrity="sha512-OQDNdI5rpnZ0BRhhJc+btbbtnxaj+LdQFeh0V9/igiEPDiWE2fG+ZsXl0JEH+bjXKPJ3zcXqNyP4/F/NegVdZg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="icon" href="Images/Ggraphixc_logo.png" type="image/png">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="Carousel.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
    <link rel="stylesheet" href="footer.css">
    <link rel="stylesheet" href="reponsive.css">
    <link rel="stylesheet" href="service.css">
    <link rel="stylesheet" href="about.css">

</head>
<body>
   <header class="header" id="header">
    <nav class="nav" id="nav">
      <div class="companyLogo" href="">
        <div id="logo">
            <a href="/index.html"><img src="Images/Ggraphixc_logo.png" alt="logo"></a>
             <a class="logoName" href="">Ggraphixc</a>
        </div>
    </div>
    <div class="nav-container" id="navContainer">
            <ul class="nav_list">
                <li class="nav_item"><a class="nav_links" id="home" href="/index.html">Welcome</a></li>
                <li class="nav_item"><a class="nav_links" id="service" href="/Service.html">Services</a></li>
                <li class="nav_item"><a class="nav_links" id="portfo" href="/Portfolio.html">Portfolio</a></li>
                <li class="nav_item"><a class="nav_links active" id="about" href="/About.php">About us</a></li>

            </ul>
            <i class="ri-close-circle-fill" class="closeBtn" id="close-btn"></i>
        </div>
        <i class="ri-menu-line" id="menu-btn" class="menuBtn"></i>




    </nav>
    
   </header>
   <main>
    <section class="aboutpage" id="aboutpage">
        <img class="clm1" id="clm1" src="Images/Ggraphixc patternArtboard 1.png" alt="">
        <div class="apagecontainer">
          <div id="typingContainer">
            <h1 class="abTx" id="abTx">We 
              <span id="aboutext"></span>
              <span class="blinkingdot"> </span>
            </h1>
          </div>
        </div>
        <div class="socialIcon social-mediaIcon" id="socialIcon">
          <i class="ri-facebook-circle-fill"></i>
          <i class="ri-instagram-fill"></i>
          <i class="ri-whatsapp-fill"></i>
          <i class="ri-linkedin-box-fill"></i>
          <i class="ri-tiktok-fill"></i>
        </div>
    </section>
    <section class="aboutusSec" id="aboutusSec">
      <div class="aboutusWrap" id="aboutusWrap">
          <div class="aboutcontent">
              <h1 class="chosetx" id="sercvif">Our Story</h1>
              <p class="descriptiontx">Ggraphixc was <b>Founded by <span style="font-size: larger; text-transform: uppercase;"> Godson Dennis</span></b>, a passionate graphic designer, Ggraphixc was born out of a desire to make high-quality, custom design accessible to brands of all sizes. Our journey began with a simple goal: to bring creativity and professionalism to every project.
              </p>
          </div>
          <div id="aboutusCont">
            <img src="Images/myImage.png " alt="">
          </div>
          <!-- <a href="" class="SYJ" id="SYJ">Start your journey with us today  &#10095;&#10095;</a> -->
      </div>
      <div class="companyvis">
        <div class="conpanvis-contaniner">
          <div>
            <h1 class="companyvis-headen" id="CVheaden">Our Vision</h1>
            <p class="descriptiontx" id="dextx">At Ggraphixc, our vision is to transform ideas into visual masterpieces that captivate and inspire. We aim to lead in innovative, client-focused design that elevates brands.
          </p>
          </div>
          <div>
            <h1 class="companyvis-headen" id="CVheaden">Our Mission</h1>
            <p class="descriptiontx" id="dextx">Our mission is to deliver innovative design solutions that exceed expectations and empower brands to connect authentically with their audiences.
          </p>
          </div>
        </div>
      </div>
  </section>
  
  <section class="abouttradeM">
    <div class="tradeM-Contanter">
      <div class="tradeM-img">
        <img id="Ggraphixc-logo" src="Images/Ggraphixc.svg" alt="">
      </div>
      <div class="tradeM-Tx">
        <h1 class="chosetx">Our Logo</h1>
        <p class="descriptiontx">
          Our tradeMark embodies our core values of creativity and precision. Its sharp lines and bold form reflect the clarity and direction we bring to every design. More than just a symbol, it represents our passion for innovation and commitment to delivering standout results for our clients.
        </p>
      </div>
    </div>
    <div class="tradeM-Contanter2">
      <h1>We offer the Following</h1>
      <ul class="serd">
        <a class="esses" href="">Branding & Identity</a>
        <a class="esses" href="">Print & Digital Design</a>
        <a class="esses" href="">Packaging Design</a>
        <a class="esses" href="">UI/UX Design</a>
        <a class="Dskem" href="">Service List</a>
      </ul>
    </div>
  </section>

  
  <section class="comment-section" id="comment-section">
    <div class="hejicomm" >
      <div class="hejicon">
        <i class="ri-feedback-line"></i>
        <i class="ri-feedback-fill"></i>
      </div>
      <h6 class="comNot" >Comment</h6>
    </div>
    <!-- Comment Display Area -->
      <div class="co_container">
          <div class="comment_area" id="comment_area">
            <?php
            if (file_exists("comments.txt")) {
                echo file_get_contents("comments.txt");
            }
            ?>
          </div>
            <!-- form Area -->
            <div class="formdetails" >
              <div class="detials" id="detials" >
                <h2 class="cones">Leave a Comment</h2>
              <form id="commentForm">
                <label for="name">Name:</label>
                <div class="former-con">
                    <input type="text" id="name" name="name" placeholder="Enter your name" autocomplete="off" required>
                    <i id="nameIcon" class="ri-checkbox-circle-fill"></i>
                </div>
                <br>

                <label for="comment">Comment:</label>
                <div class="former-con">
                    <textarea id="comment" name="comment" cols="30" rows="10" placeholder="Message" autocomplete="off" required></textarea>
                    <i id="commentIcon" class="ri-checkbox-circle-fill"></i>
                </div>
                <br>

                <label for="rating">Rate Us:</label>
                <div class="star-rating">
                    <i class="ri-star-line" data-value="1"></i>
                    <i class="ri-star-line" data-value="2"></i>
                    <i class="ri-star-line" data-value="3"></i>
                    <i class="ri-star-line" data-value="4"></i>
                    <i class="ri-star-line" data-value="5"></i>
                </div>
                
                <!-- Hidden input field to capture the selected rating -->
                <input type="hidden" name="rating" id="ratingValue" value="0">

                <input id="submitbtn" type="submit" value="Comment">
              </form>

            <!-- Loading Spinner -->
            <div id="loadingSpinner" style="display: none;">
                <i class="ri-loader-4-fill ri-spin"></i> Loading...
            </div>

            <!-- Submission Confirmation Message -->
            <div id="confirmationMessage" style="display: none;">
                <i class="ri-check-double-fill"></i>
                <p>Your comment was submitted successfully!</p>
            </div>
              <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
              </div>
              <div class="detials" id="detials" >
                <div class="details-add">
                  <h5><i class="ri-home-office-fill"></i>Address</h5>
                  <a href="#">Along sapele road Benin city, Edo state Nigeria.</a>
                </div>
                <div class="details-add">
                  <h5><i class="ri-mail-fill"></i>Email</h5>
                  <a href="#">ggraphixc@gmail.com</a>
                </div>
                <div class="details-add">
                  <h5><i class="ri-phone-fill"></i>Mobile</h5>
                  <a href="#">+2349125631993</a>
                </div>
                <div class="details-add" id="details-add" >
                  <a href=""><i class="ri-facebook-circle-fill"></i></a>
                  <a href=""><i class="ri-instagram-fill"></i></a>
                  <a href=""><i class="ri-whatsapp-fill"></i></a>
                  <a href=""><i class="ri-linkedin-box-fill"></i></a>
                  <a href=""><i class="ri-tiktok-fill"></i></a> 
                </div>
              </div>
            </div>
      </div>
  

    
    
</section>
    

    <footer class="footer" id="footer">
        <article class="footerForm">
            
                <h4 id="footerHT">Newsletter</h4>
                <p>
                  Subscribe to our newsletter for a weekly dose
                  of news, updates, helpful tips, and
                  exclusive offers.
                </p>
                <form action="#">
                  <input type="text" placeholder="Your email" required>
                  <button id="whitebt" type="submit">SUBSCRIBE</button>
                </form>
                <div class="icons">
                  <i class="fa-brands fa-facebook-f"></i>
                  <i class="fa-brands fa-twitter"></i>
                  <i class="fa-brands fa-linkedin"></i>
                  <i class="ri-tiktok-fill"></i>
                </div>
              
        </article>
        <div class="footer-row" id="footer-row">
          <div class="footer-col" id="footer-col">
            <h4 id="footerHT">Info</h4> 
            <ul class="links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Compressions</a></li>
              <li><a href="#">Customers</a></li>
              <li><a href="#">Service</a></li>
              <li><a href="#">Collection</a></li>
            </ul>
          </div>
  
          <div class="footer-col" id="footer-col">
            <h4 id="footerHT">Explore</h4>
            <ul class="links">
              <li><a href="#">Free Designs</a></li>
              <li><a href="#">Latest Designs</a></li>
              <li><a href="#">Themes</a></li>
              <li><a href="#">Popular Designs</a></li>
              <li><a href="#">Art Skills</a></li>
              <li><a href="#">New Uploads</a></li>
            </ul>
          </div>
  
          <div class="footer-col" id="footer-col">
            <h4 id="footerHT">Legal</h4>
            <ul class="links">
              <li><a href="#">Customer Agreement</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">GDPR</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Testimonials</a></li>
              <li><a href="#">Media Kit</a></li>
            </ul>
          </div>
  
          
        </div>
    </footer>

   </main>
    <script src="main.js"></script>
    <script src="Carousel.js"></script>
    <script src="portfolio.js"></script>
    <script src="typed/abouttyped.js"></script>
    <script src="about.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <!-- <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> -->
    

    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/smooth-scroll/16.1.3/smooth-scroll.polyfills.min.js"></script> -->

</body>
</html>