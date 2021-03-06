$(function() {

let files,
    looks,
    activeLook,
    steps = 1,
    products = 1,
    colorthemes = 1,
    isHeroku = false;

// Use text box if running on Heroku
function checkForHeroku() {
  if (window.location.href.includes('nameless-fortress-80718')) {
    isHeroku = true;
    $('.image-file').addClass('hide');
    $('.imgur-instructions').removeClass('hide');
  };
};
checkForHeroku();

// Handle image files
$('body').on('change', '#edit-file-uploader', prepareUpload); 
$('body').on('change', '#create-look-uploader', prepareUpload);
function prepareUpload (event) { files = event.target.files; }

// ********** HOMEPAGE BUTTONS AND NAVIGATION *************

$('.show-create-look').click(function() {
  $('.create-look').show();
  $('.user-looks-area').hide();
  $('.public-looks-area').hide();
  $('.homepage-buttons').hide();
});

$('.show-user-looks').click(function() {
  goToUserLooks();
});

$('.show-public-looks').click(function() {
  $('.public-looks-area').show();
  $('.create-look').hide();
  $('.user-looks-area').hide();
  $('.homepage-buttons').hide();
});

$('.show-homepage-buttons').click(function() {
  $('.homepage-buttons').show();
  $('.create-look').hide();
  $('.user-looks-area').hide();
  $('.public-looks-area').hide();
})

function goToUserLooks() {
  $('.user-looks-area').show();
  $('.create-look').hide();
  $('.public-looks-area').hide();
  $('.homepage-buttons').hide();
}

//  ********* DISPLAY LOOKS THUMBNAILS  ************

function loadLibrary() { 
  // Get library of looks
  $.ajax({
    url: "/api/makeuplooks",
    method: "GET",
    success: function(data) {
      displayAllUsersMakeupLooks(data);
      displayOneUsersMakeupLooks(data);
    },
    error: function(err) {
      console.log(err.responseText);
      window.location = "index.html"
    }
  });
};
loadLibrary();

function displayAllUsersMakeupLooks(data) {
  let returnHTML = "";
  looks = {};
  let results = data.makeupLooks;
  results.forEach(function(item) {
    returnHTML += makeThumbnail(item);
    looks[item.id] = item;
  })
  $('.public-looks').html(returnHTML);
};

function displayOneUsersMakeupLooks(data) {
  let returnHTML = "";
  let results = data.makeupLooks;
  let username = sessionStorage.getItem('username');
  results.forEach(function(item) {
    if(`${item.username}` === username) {
      returnHTML += makeThumbnail(item)
    }
  });
  $('.user-looks').html(returnHTML);
};

function makeThumbnail(item) {
  return `<div class="thumbnail col-4" data-ref="${item.id}" tabindex="0">
     <div class="thumbnail-content"> 
       <div style= "background-image: url(${item.image});" class="thumbnail-img thumbnail-${item.id}"> </div>
       <div class="title-${item.id}"=>${item.title}</div>
     </div>
   </div>`;
 };

// ******* CREATE LOOK *********

// Submit handler for creating a look form
$('#create-look-form').submit(function(e) {
  e.preventDefault();
  let stepsArray = [];
  let productsArray = [];
  let colorthemesArray =[];
  let skinType = $('#select-skintype').val();

  for(let i = 1; i <= steps; i++) {
    let inputField = $(`input[name=step_${i}]`);
    // if it exists on the page
    if (inputField.length) {
      // prevent commas from creating new i
      stepsArray.push(replaceCommasWithHTMLEntities(inputField));
    }
  }

  for(let i = 1; i <= products; i++) {
    let inputField = $(`input[name=product_${i}]`);
    // if it exists on the page
    if (inputField.length) {
      productsArray.push(replaceCommasWithHTMLEntities(inputField));
    }
  }

  for(let i = 1; i <= colorthemes; i++) {
    let inputField = $(`input[name=colortheme_${i}]`);
    // if it exists on the page
    if (inputField.length) {
      colorthemesArray.push(replaceCommasWithHTMLEntities(inputField));
    }
  }

  // If user doesn't select a skintype
  if($('#select-skintype').val() === "Select skintype") {
    skinType = "N/A";
  }

  // Remove falsy values from arrays
  stepsArray = stepsArray.filter(Boolean);
  productsArray = productsArray.filter(Boolean);
  colorthemesArray = colorthemesArray.filter(Boolean);

  // Compile key/value pairs to send form data
  let data = new FormData(); 
  if(!isHeroku) {
    $.each(files, function(key, value) { data.append(key, value); });
  }
  // first argument is the name
  data.append("title", $('input[name=title]').val());
  data.append("steps", stepsArray);
  data.append("products", productsArray);
  data.append("skintype", skinType);
  data.append("colortheme", colorthemesArray);
  
  if(isHeroku) {
    data.append("imageLink", $('input[name=imageLink]').val());
  }

  // API request
  $.ajax({
    url: '/api/makeuplooks/create',
    type: "POST",
    data: data,
    cache: false, 
    dataType: 'json', 
    processData: false, 
    contentType: false,
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`},
    success: function(data) {
      file = {};
      // add to looks object
      looks[data.id] = data;
      // add it to the public library
      $('.public-looks').append(makeThumbnail(data));
      // add it to the user library
      $('.user-looks').append(makeThumbnail(data));
      goToUserLooks();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
});

// Add fields in the create look form
$('#create-look-form .add-step').click(e => {
  e.preventDefault();
  steps++;
  let newHTML = `
    <div><input type="text" name="step_${steps}" class="step multiple-fields-option" />
    <button class="delete-field">&times;</button></div>
  `;
  $('.steps').append(newHTML);
});

$('#create-look-form .add-product').click(e => {
  e.preventDefault();
  products++;
  let newHTML = `
    <div><input type="text" name="product_${products}" class="product multiple-fields-option" />
    <button class="delete-field">&times;</button></div>
  `;
  $('.products').append(newHTML);
});

$('#create-look-form .add-colortheme').click(e => {
  e.preventDefault();
  colorthemes++;
  let newHTML = `
    <div><input type="text" name="colortheme_${colorthemes}" class="colortheme multiple-fields-option" />
    <button class="delete-field">&times;</button></div>
  `;
  $('.colorthemes').append(newHTML);
});

// Delete field in the create look form
$('.create-look').on('click', '.delete-field', function(e) {
  $(this).parent().remove();
});

// ******** MODAL **********

// Open modal listener
$('body').on('click', '.thumbnail', function(e) {
  let clickedThumbnailId = $(this).attr("data-ref");
  activeLook = looks[clickedThumbnailId];
  openModal(activeLook);
});

// Open modal listener on keypress
$('body').on('keypress', '.thumbnail', function(e) {
  if(e.which === 13) {
    let clickedThumbnailId = $(this).attr("data-ref");
    activeLook = looks[clickedThumbnailId];
    openModal(activeLook);
  }
});

// Close modal listener
$('.modal').on('click', '.close', function(e) {
  $('.modal').hide();
  $('.look-info').removeClass('hide');
  $('.edit-info').addClass('hide');
});

function openModal(look) {
  let string = formatLook(look);
  $('.look-info').html(string);
  $('.modal').show();
};

function formatLook(look) {
  let editDelete = (look.username === sessionStorage.getItem('username'))?`<div class="edit-delete-buttons"><button class="edit-btn" data-ref="${look.id}">Edit</button>
  <button class="delete-btn" data-ref="${look.id}">Delete</button></div>` : ``;
  let steps = "";
  let products = "";
  let colorthemes = "";

  // Convert objects to string to array, then add to html
  look.steps.toString().split(",").forEach(step => {
    steps += `<li>${step}</li>`;
  }) ;
  
  look.products.toString().split(",").forEach(product => {
    products += `<li>${product}</li>`;
  });
 
  look.colortheme.toString().split(",").forEach(colortheme => {
    colorthemes += `<li>${colortheme}</li>`;
  });

  return `<div>
    <img src="${look.image}"/>
    <h3>${look.title}</h3>
    <h4>Steps:</h4>
    <ol>${steps}</ol>
    <h4>Products:</h4>
    <ul>${products}</ul>
    <h4>Skin Type:</h4>
    <p>${look.skintype}</p>
    <h4>Color Themes:</h4>
    <ul>${colorthemes}</ul>
    <h4>Created by: ${look.username}</h4>
      ${editDelete}
  </div>`
};

// ****** DELETE A LOOK ******

// Delete look listener
$( '.modal-content' ).on('click', '.delete-btn',function() {
  if(confirm("Are you sure you want to delete this look?")) {
    let id = $(this).attr('data-ref');
    deleteLook(id);
    $('.modal').hide();
 } 
});

function deleteLook(look, callback) {
  const settings = {
    method: "DELETE",
    success: function() {
      // remove from local object
      looks[look] = undefined;
      // remove from page
      $(`div[data-ref=${look}]`).remove();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  }
  $.ajax(`/api/makeuplooks/${look}`, settings);
};

// ****** EDIT A LOOK ******

// Submit edits 
$('body').on('submit', '#edit-look-form', function(e) {
  e.preventDefault();

  let stepsArray = [];
  let productsArray = [];
  let colorthemesArray =[];
  let skinType = $("#edit-select-skintype").val();
  let steps = $("#edit-look-form .step").length;
  let products = $('#edit-look-form .product').length;
  let colorthemes = $('#edit-look-form .colortheme').length;

  
  for(let i = 1; i <= steps; i++) {
    let inputField = $(`#edit-look-form input[name=step_${i}]`);
    // if it exists on the page
    if (inputField.length) {
      stepsArray.push(replaceCommasWithHTMLEntities(inputField));
    }
  }
  
  for(let i = 1; i <= products; i++) {
    let inputField = $(`#edit-look-form input[name=product_${i}]`);
    // if it exists on the page
    if (inputField.length) {
      productsArray.push(replaceCommasWithHTMLEntities(inputField));
    }
  }

  for(let i = 1; i <= colorthemes; i++) {
    let inputField = $(`#edit-look-form input[name=colortheme_${i}]`);
    // if it exists on the page
    if (inputField.length) {
      colorthemesArray.push(replaceCommasWithHTMLEntities(inputField));
    }
  }

  // If user doesn't select a skintype
  if($('#edit-select-skintype').val() === "Select skintype") {
    skinType = "N/A";
  }

  // Remove falsy values from arrays
  stepsArray = stepsArray.filter(Boolean);
  productsArray = productsArray.filter(Boolean);
  colorthemesArray = colorthemesArray.filter(Boolean);

  // Compile key/value pairs to send form data
  let data = new FormData(); 
  if(!isHeroku) {
    $.each(files, function(key, value) { data.append(key, value); });
  }
  // first argument is the name
  data.append("title", $('#edit-look-form input[name=title]').val());
  data.append("id", $('#edit-look-form input[name=id]').val());
  data.append("steps", stepsArray);
  data.append("products", productsArray);
  data.append("skintype", skinType);
  data.append("colortheme", colorthemesArray);

  if(isHeroku) {
    data.append("imageLink", $('#edit-look-form input[name=imageLink]').val());
  }
  
  // API request
  $.ajax({
    url: '/api/makeuplooks/update',
    type: "PUT",
    data: data,
    cache: false, 
    dataType: 'json', 
    processData: false, 
    contentType: false,
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`},
    success: function(data) {
      files = {};
      // remove it from the public and user library
      $(`div[data-ref=${data.id}]`).remove();
      // add to looks object
      looks[data.id] = data;
      // add it to the public library
      $('.public-looks').append(makeThumbnail(data));
      // add it to the user library
      $('.user-looks').append(makeThumbnail(data));
      // close modal
      $('.modal').hide();
      $('.look-info').removeClass('hide');
      $('.edit-info').addClass('hide');
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
});

// Delete field in the create look form
$('.create-look').on('click', '.delete-field', function(e) {
  $(this).parent().remove();
});

function displayEditForm(look) {
  let stepsArray = look.steps[0].split(",");
  let productsArray = look.products[0].split(",");
  let colorthemesArray = look.colortheme[0].split(",");

  let skinTypeOptions = "";
  ['oily', 'dry', 'combination', 'normal'].forEach(item => {
    if(look.skintype === item) {
      skinTypeOptions+= `<option selected>${item}</option>`
    } else {
      skinTypeOptions+= `<option>${item}</option>`
    };
  });

  let steps = "";
  if (!look.steps) {
    steps = `<input type="text" name="step_1" class="step"/><br/>`;
  } else {
    stepsArray.forEach((step, index) => {
      let stepNumber = index +1;
      if(index === 0) {
        steps = `<input type="text" name="step_1" class="step" value="${step}"/><br/>`;
      } else {
        steps+= `<div><input type="text" name="step_${stepNumber}" class="step multiple-fields-option" value="${step}"/>
        <button class="delete-field">&times;</button></div>`
      };
    });
  };

  let products = "";
  if (!look.products) {
    products = `<input type="text" name="product_1" class="product"/><br/>`;
  } else {
    productsArray.forEach((product, index) => {
      let productNumber = index +1;
      if(index === 0) {
        products = `<input type="text" name="product_1" class="product" value="${product}"/><br/>`;
      } else {
        products+= `<div><input type="text" name="product_${productNumber}" class="product multiple-fields-option" value="${product}"/>
        <button class="delete-field">&times;</button></div>`
      };
    });
  };

  let colorthemes = "";
  if (!look.colortheme) {
    colorthemes = `<input type="text" name="colortheme_1" class="product"/><br/>`;
  } else {
    colorthemesArray.forEach((colortheme, index) => {
      let colorthemeNumber = index +1;
      if(index === 0) {
        colorthemes = `<input type="text" name="colortheme_1" class="colortheme" value="${colortheme}"/><br/>`;
      } else {
        colorthemes+= `<div><input type="text" name="colortheme_${colorthemeNumber}" class="colortheme multiple-fields-option" value="${colortheme}"/>
        <button class="delete-field">&times;</button></div>`
      };
    });
  };

  return `<form role="form" id="edit-look-form" enctype="multipart/form-data">
          <div class="image-file">
            <input type="file" id="edit-file-uploader" name="image" class="image-upload"/>
          </div>
          <div class="imgur-instructions hide">
            <label for="image-link">Image Link</label><br/>
            <input type="text" name="imageLink"/>
          </div>
          <label for="title">Title</label><br/>
          <input type="text" name="title" value="${look.title}" required/><br/>
          <input type="hidden" name="id" value="${look.id}"/>
          <div class="steps">
          <label for="steps">Steps</label>
            <br/>${steps}
          </div>
          <button class="small italic add-step">Add another step</button>
          <div class="products">
            <label for="products">Products</label>
            <br/>${products}
          </div>
          <button class="small italic add-product">Add another product</button>
          <div class="skintype">
          <label for="skintype">Skin Type</label>
            <select id="edit-select-skintype">
              <option>Select skintype</option>
              ${skinTypeOptions}
            </select>
          </div>
          <div class="colorthemes">
            <label for="colorthemes">Color Themes</label>
            <br/>${colorthemes}
          </div>
          <button class="add-colortheme">Add another color theme</button>
          <div class="submit-cancel-buttons">
            <button type="submit" class="edit-look-btn">Submit</button>
            <button type="button" class="cancel-edit">Cancel</button>
          <div>
      </form>`
    };

// add another step in edit form
$('.edit-info').on('click', '.add-step', function(e) {
  e.preventDefault();
  let steps = $("#edit-look-form .step").length;
  steps++;
  let newHTML = `
    <div><input type="text" name="step_${steps}" class="step multiple-fields-option" />
    <button class="delete-field">&times;</button></div>
  `;
  $('#edit-look-form .steps').append(newHTML);
});

// add another product field in edit form
$('.edit-info').on('click', '.add-product', e => {
  e.preventDefault();
  let products = $("#edit-look-form .product").length;
  products++;
  let newHTML = `
    <div><input type="text" name="product_${products}" class="product multiple-fields-option" />
    <button class="delete-field">&times;</button></div>
  `;
  $('#edit-look-form .products').append(newHTML);
});

// add another color theme field in edit form
$('.edit-info').on('click', '.add-colortheme', e => {
  e.preventDefault();
  let colorthemes = $("#edit-look-form .colortheme").length;
  colorthemes++;
  let newHTML = `
    <div><input type="text" name="colortheme_${colorthemes}" class="colortheme multiple-fields-option" />
    <button class="delete-field">&times;</button></div>
  `;
  $('#edit-look-form .colorthemes').append(newHTML);
});

// Delete field in the create look form
$('.edit-info').on('click', '.delete-field', function(e) {
  $(this).parent().remove();
});

// Cancel edit form listener
$('.modal').on('click', '.cancel-edit', function(e) {
  $('.modal').hide();
  $('.look-info').removeClass('hide');
  $('.edit-info').addClass('hide');
});

// Edit button listener
$( '.modal-content' ).on('click', '.edit-btn', function(e) {
  e.preventDefault();
  $('.look-info').addClass('hide');
  $('.edit-info').removeClass('hide');
  $('.edit-info').html(displayEditForm(activeLook));
  checkForHeroku();
});

// **** FORMS ****

// prevent commas from creating new input fields by replacing commas with HTML entities
function replaceCommasWithHTMLEntities(input) {
  let inputFieldValue = input.val();
  inputFieldValue = inputFieldValue.replace(/,/g, '&#44;');
  return inputFieldValue;
}

});