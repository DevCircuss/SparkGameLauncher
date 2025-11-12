window.addEventListener('DOMContentLoaded', async () => {
  const imageGrid = document.getElementById('image-grid');
  const topBar = document.getElementById('top-bar');
  const searchBox = document.getElementById('search-box');
  const zoomSlider = document.getElementById('zoom-slider');
  const sortDropdown = document.getElementById('sort-dropdown');
  const filterCondition = document.getElementById('filter-condition');
  const contextMenu = document.getElementById('context-menu');
  const addGameButton = document.getElementById('add-game-button');
  const addGameForm = document.getElementById('add-game-form');
  const editCollectionForm = document.getElementById('edit-collection-form');
  const collectionFormName = document.getElementById('collectionname');
  const closeFormButton = document.getElementById('close-form-button');
  const closeCollectionFormButton = document.getElementById('close-collection-form-button');
  const saveCollectionButton = document.getElementById('submit-collection');
  const gameForm = document.getElementById('game-form');
  const CollectionForm = document.getElementById('collection-form');
  const boxartInput = document.getElementById('game-boxart');
  const boxartPreview = document.getElementById('boxart-preview');
  const prevBoxartButton = document.getElementById('prev-boxart-button');
  const nextBoxartButton = document.getElementById('next-boxart-button');
  const findBoxartButton = document.getElementById('find-boxart-button');
  const collectionartPreview = document.getElementById('collectionart-preview');
  const prevcollectionartButton = document.getElementById('prev-collectionart-button');
  const nextcollectionartButton = document.getElementById('next-collectionart-button');
  const findcollectionartButton = document.getElementById('find-collectionart-button');
  const settingsButton = document.getElementById('settings-button');
  const settingsForm = document.getElementById('settings-form');
  const closeSettingsButton = document.getElementById('close-settings-button');
  const saveSettingsButton = document.getElementById('save-settings-button');
  const background1Input = document.getElementById('background1');
  const background2Input = document.getElementById('background2');
  const collectionbackground1Input = document.getElementById('collection-background1');
  const collectionbackground2Input = document.getElementById('collection-background2');
  const fontColorInput = document.getElementById('font-color');
  const steamgriddbKeyInput = document.getElementById('steamgriddb-key');
  const dirname = window.api.getDirname();
  //const gamesFilePath = window.api.join(dirname, '../src/assets/games.json');
  const assetsPath = await window.api.getAssetsPath();
  const gamesFilePath = window.api.join(assetsPath, 'games.json');
  const settingsFilePath = window.api.join(dirname, '../src/assets/settings.json');
  const defaultBoxartPath = '../src/assets/images/DEFAULT_BOXART.png';
  //let games = JSON.parse(window.api.readFileSync(gamesFilePath, 'utf-8'));
  const settings = JSON.parse(window.api.readFileSync(settingsFilePath, 'utf-8'));
  const bottomBar = document.getElementById('bottom-bar');
  const controlsLegend = document.getElementById('controls-legend');
  let hideTimeout;

  let currentCollection = null;
  let focusedCollection = null;
  zoomSlider.value = settings[0].default_zoom;
  let currentScale = zoomSlider.value;

  const collections = new Set();
  let activeElement = null;
  let foundGrids = [];
  let focusedGridIndex = 0;

  let showBanners = false;

  // Ensure the assets directory exists
  if (!window.api.pathexistsSync(assetsPath)) {
    window.api.mkdirSync(assetsPath, { recursive: true });
  }

  // Load games from the assets directory
  let games = [];
  try {
    games = JSON.parse(window.api.readFileSync(gamesFilePath, 'utf-8'));
  } catch (error) {
    console.error('Error reading games file:', error);
  }

  // Example usage: Call toggleBanners() to toggle the visibility of the banners
  function toggleBanners() {
    showBanners = !showBanners;
    const banners = document.getElementsByClassName('game-banner');
    Array.from(banners).forEach(banner => {
      banner.style.visibility = showBanners ? 'visible' : 'hidden';
    });
  }

  // set the ~ key to toggle the visibility of the banners
  window.addEventListener('keydown', (event) => {
    if (event.key === '`') {
      toggleBanners();
    }
  });

  // Set the form container background color to theme_color1 from settings.json
  document.documentElement.style.setProperty('--form-container-bg', settings[0].theme_color2);
  document.documentElement.style.setProperty('--form-font-color', settings[0].font_color);
  document.documentElement.style.setProperty('--form-field-color', settings[0].theme_color1);

  // Show the settings form when the "Settings" button is clicked
  settingsButton.addEventListener('click', () => {
    background1Input.value = settings[0].theme_color1;
    background2Input.value = settings[0].theme_color2;
    fontColorInput.value = settings[0].font_color;
    steamgriddbKeyInput.value = settings[1].scraper_steamgriddb_key;
    settingsForm.style.display = 'block';
  });

  // Hide the settings form when the close button is clicked

  closeSettingsButton.addEventListener('click', () => {
    settingsForm.style.display = 'none';
  });

  // Switch between tabs in the settings form
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Save the settings when the "Save" button is clicked
  saveSettingsButton.addEventListener('click', () => {
    settings[0].theme_color1 = background1Input.value;
    settings[0].theme_color2 = background2Input.value;
    settings[0].font_color = fontColorInput.value;
    settings[1].scraper_steamgriddb_key = steamgriddbKeyInput.value;

    window.api.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');

    // Apply the new settings
    document.documentElement.style.setProperty('--form-container-bg', settings[0].theme_color2);
    document.documentElement.style.setProperty('--form-font-color', settings[0].font_color);
    document.documentElement.style.setProperty('--form-field-bg', settings[0].theme_color1);

    settingsForm.style.display = 'none';
  });

  // Initialize the first tab as active
  document.querySelector('.tab-button[data-tab="appearance"]').classList.add('active');
  document.getElementById('appearance-tab').classList.add('active');

  function loadInitialGrid(collection) {
    currentCollection = collection;
    // Clear the grid
    imageGrid.innerHTML = '';

    // Clear the collections set
    collections.clear();

    // Apply default theme colors from settings.json
    document.body.style.background = `linear-gradient(to top, ${settings[0].theme_color1}, ${settings[0].theme_color2})`;
    
    let gamecollections = new Set();

    // Add games and collections to the grid
    try {
      games.forEach((game) => {
        if (game.collection) {
          if (!gamecollections.has(game.collection)) {
            collections.add(game);
            gamecollections.add(game.collection);
          }
        } else {
          // Create the game container
          const gameContainer = document.createElement('div');
          gameContainer.className = 'game-container';

          // Create the image container
          const imageContainer = document.createElement('div');
          imageContainer.className = 'grid-image-container';

          // Create the game image
          const imgElement = document.createElement('img');
          imgElement.src = `file://${window.api.join(dirname, '../src/assets/images', game.boxart)}`;
          imgElement.onerror = () => {
            imgElement.src = defaultBoxartPath;
          };
          imgElement.className = 'grid-image';
          imgElement.dataset.name = game.name || ''; // Ensure the game name is set
          imgElement.dataset.sortTitle = game.sortTitle || ''; // Ensure the sort title is set
          imgElement.dataset.console = game.console || ''; // Ensure the console is set
          imgElement.dataset.release = game.release || ''; // Ensure the release date is set
          imgElement.dataset.favorite = game.favorite || 'false'; // Ensure the favorite status is set

          // Check if the release date is in the future
          const releaseDate = new Date(game.release);
          const currentDate = new Date();
          if (releaseDate > currentDate) {
            imgElement.classList.add('future-release'); // Apply the darkening effect
          }

          // Add middle mouse button event listener
          imgElement.addEventListener('mousedown', (event) => {
            if (event.button === 1) { // Middle mouse button
              event.preventDefault();
              filterBySortTitle(game.sortTitle);
            }
          });

          imgElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            openContextMenu(event, game, false);
          });
          // gameContainer.appendChild(imgElement);
          // imageGrid.appendChild(gameContainer);
          // Append the image to the image container
          imageContainer.appendChild(imgElement);

          // Append the image container to the game container
          gameContainer.appendChild(imgElement.parentNode);

          // Append the game container to the grid
          imageGrid.appendChild(gameContainer);

          // Add banner if the game has a console variable
          const consoleType = imgElement.dataset.console || '';
          addBanner(imgElement, consoleType);

          // Hide the gameContainer if the game is marked as hidden
          if (game.hide) {
            console.log('Hiding game:', game.name);
            gameContainer.style.display = 'none';
          }
        }
      });
    } catch (error) {
      console.error('Error loading games:', error);
    }

    collections.forEach((collection) => {
      // Create the collection container
      const collectionContainer = document.createElement('div');
      collectionContainer.className = 'game-container collection-item';

      // Create the image container
      const imageContainer = document.createElement('div');
      imageContainer.className = 'grid-image-container';

      const collectionImagePath = window.api.join(dirname, '../src/assets/collections', `${collection.collection}.png`);
      const imgElement = document.createElement('img');
      imgElement.src = `file://${collectionImagePath}`;
      imgElement.onerror = () => {
        imgElement.src = `file://${window.api.join(dirname, '../src/assets/collections', 'DEFAULT_COLLECTION.png')}`;
        // Create the collection text element
        const collectionElement = document.createElement('div');
        collectionElement.textContent = collection.collection;
        collectionElement.style.position = 'absolute'; // Set position to absolute
        collectionElement.style.bottom = '0'; // Position at the bottom
        collectionElement.style.left = '0'; // Position at the left
        collectionElement.style.width = '100%'; // Full width
        collectionElement.style.height = 'auto'; // Auto height
        collectionElement.style.display = 'flex'; // Use flexbox to center the text
        collectionElement.style.alignItems = 'center'; // Center vertically
        collectionElement.style.justifyContent = 'center'; // Center horizontally
        collectionElement.style.backgroundColor = 'rgba(0, 0, 0, 0)'; // Semi-transparent background
        collectionElement.style.color = 'white'; // Text color
        collectionElement.style.fontSize = '1.5rem'; // Font size
        collectionElement.style.pointerEvents = 'none'; // Make the text element transparent to mouse events

        collectionContainer.appendChild(collectionElement);
      };
      imgElement.className = 'grid-image';
      imgElement.dataset.name = collection.collection; // Ensure the collection name is set
      imgElement.dataset.sortTitle = collection.collection; // Ensure the sort title is set
      imgElement.dataset.collection = collection.collection; // Store the collection name in a data attribute
      imgElement.dataset.isCollection = 'true'; // Mark this as a collection item
      imgElement.dataset.release = ''; // Ensure the release date is set
      imgElement.addEventListener('click', () => {
        filterGridByCollection(collection.collection);
      });
      imgElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        openContextMenu(event, collection, true);
      });
      collectionContainer.appendChild(imgElement);
      imageGrid.appendChild(collectionContainer);
    });

    // Apply the current scale
    adjustGridScale(currentScale);
    //sortGrid(sortDropdown.value);
  }

  function setActiveElement(element) {
    if (activeElement) {
      activeElement.classList.remove('active');
    }
    activeElement = element;
    activeElement.classList.add('active');
  }

  function showBottomBar() {
    bottomBar.classList.add('visible');
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    hideTimeout = setTimeout(() => {
      bottomBar.classList.remove('visible');
    }, 5000); // Hide after 5 seconds
  }

  function updateControlsLegend(inputType) {
    if (inputType === 'gamepad') {
      controlsLegend.textContent = 'D-Pad - Navigate';
    } else {
      controlsLegend.textContent = '[TAB] = Toggle Filter Bar.....[~] = Toggle Console Banners.....[RMB] = Game Options.....[MMB] = Show Versions';
    }
  }

  // Detect keyboard/mouse input
  window.addEventListener('keydown', () => {
    updateControlsLegend('keyboard');
    showBottomBar();
  });

  window.addEventListener('mousemove', () => {
    updateControlsLegend('keyboard');
    showBottomBar();
  });

  // Detect gamepad input
  window.addEventListener('gamepadconnected', () => {
    updateControlsLegend('gamepad');
    showBottomBar();
  });

  window.addEventListener('gamepaddisconnected', () => {
    updateControlsLegend('keyboard');
    showBottomBar();
  });

  // Poll for gamepad input
  function pollGamepads() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        updateControlsLegend('gamepad');
        showBottomBar();
        break;
      }
    }
    requestAnimationFrame(pollGamepads);
  }

  pollGamepads();

  function filterBySortTitle(sortTitle) { // Middle mouse click event for showing versions of the same game
    if (!sortTitle) return; // Do nothing if sortTitle is empty
  
    // Get all game containers
    const containers = document.getElementsByClassName('game-container');
    console.log('Containers:', containers); // Debugging
  
    // Count how many games share the same sortTitle
    const gamesWithSortTitle = games.filter(game => game.sortTitle === sortTitle);
  
    if (gamesWithSortTitle.length <= 1) return; // Do nothing if only one game has this sortTitle
  
    // Hide all games except those with the same sortTitle
    Array.from(containers).forEach((container) => {
      const imgElement = container.querySelector('.grid-image');
      const gameSortTitle = imgElement ? imgElement.dataset.sortTitle : '';
      const isCollectionItem = container.classList.contains('collection-item');
  
      if (gameSortTitle !== sortTitle || isCollectionItem) {
        container.style.display = 'none'; // Hide games with a different sortTitle
      } else {
        container.style.display = 'block'; // Show games with the same sortTitle
        // Make the banner visible if it exists
        const banner = container.querySelector('.game-banner');
        if (banner) {
          banner.style.visibility = 'visible';
        }
      }
    });
  }

  function addBanner(imgElement, consoleType) {
    console.log('Adding banner for:', consoleType); // Debugging
  
    // Create the banner image path
    const bannerImagePath = `file://${window.api.join(dirname, '../src/assets/banners', `${consoleType.toLowerCase()}.png`)}`;
    console.log('Banner image path:', bannerImagePath); // Debugging
  
    // Create an Image object to check if the banner image exists
    const testImage = new Image();
    testImage.src = bannerImagePath;
  
    // Check if the image loads successfully
    testImage.onload = () => {
      // Create the banner element
      const banner = document.createElement('img');
      banner.className = 'game-banner';
      banner.src = bannerImagePath;
  
      // Append the banner to the imgElement's parent container
      const container = imgElement.parentNode;
      container.appendChild(banner);
  
      // Debugging: Check if the banner is appended correctly
      console.log('Banner added:', banner);
      console.log('Container:', container);

      if (showBanners) {
        banner.style.visibility = 'visible';
      } else {
        banner.style.visibility = 'hidden';
      }
    };
  
    // Handle image load error
    testImage.onerror = () => {
      console.log('Banner image not found:', bannerImagePath); // Debugging
    };
  }

  function filterGridByCollection(collection) {
    currentCollection = collection;
    // Clear the grid
    imageGrid.innerHTML = '';

    // Change background colors based on the collection name
    const collectionSettings = settings.find(setting => setting[collection]);
    if (collectionSettings) {
      const themeColor1 = collectionSettings[collection].theme_color1;
      const themeColor2 = collectionSettings[collection].theme_color2;
      document.documentElement.style.setProperty('--theme-color1', themeColor1);
      document.documentElement.style.setProperty('--theme-color2', themeColor2);
      document.body.style.background = `linear-gradient(to top, ${themeColor1}, ${themeColor2})`;
    
    } else {
      // Revert to default theme colors if no specific settings found
      document.body.style.background = `linear-gradient(to top, ${settings[0].theme_color1}, ${settings[0].theme_color2})`;
    }
    games.forEach((game) => {
      if (game.collection === collection) {
        // Create the game container
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';

        // Create the image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'grid-image-container';

        // Create the game image
        const imgElement = document.createElement('img');
        imgElement.src = `file://${window.api.join(dirname, '../src/assets/images', game.boxart)}`;
        imgElement.onerror = () => {
          imgElement.src = defaultBoxartPath;
        };
        imgElement.className = 'grid-image';
        imgElement.dataset.name = game.name || ''; // Ensure the game name is set
        imgElement.dataset.sortTitle = game.sortTitle || ''; // Ensure the sort title is set
        imgElement.dataset.console = game.console || ''; // Ensure the console is set
        imgElement.dataset.release = game.release || ''; // Ensure the release date is set
        imgElement.dataset.favorite = game.favorite || 'false'; // Ensure the favorite status is set

        // Check if the release date is in the future
        const releaseDate = new Date(game.release);
        const currentDate = new Date();
        if (releaseDate > currentDate) {
          imgElement.classList.add('future-release'); // Apply the darkening effect
        }
    
        // Add middle mouse button event listener
        imgElement.addEventListener('mousedown', (event) => {
          if (event.button === 1) { // Middle mouse button
            event.preventDefault();
            console.log('Middle mouse button clicked:', game.name);
            filterBySortTitle(game.sortTitle);
          }
        });
    
        imgElement.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          openContextMenu(event, game, false);
        });
        // imageGrid.appendChild(imgElement);
        // Append the image to the image container
        imageContainer.appendChild(imgElement);

        // Append the image container to the game container
        gameContainer.appendChild(imgElement.parentNode);

        // Append the game container to the grid
        imageGrid.appendChild(gameContainer);

        // Add banner if the game has a console variable
        const consoleType = imgElement.dataset.console || '';
        addBanner(imgElement, consoleType);

        // Hide the gameContainer if the game is marked as hidden
        if (game.hide) {
          console.log('Hiding game:', game.name);
          gameContainer.style.display = 'none';
        }
      }
    
        // Apply the current scale
        adjustGridScale(currentScale);
        //sortGrid(sortDropdown.value);
    });
  }

  function filterGridByName(query) {
    const images = imageGrid.getElementsByClassName('grid-image');
    Array.from(images).forEach((img) => {
      const name = img.dataset.name || ''; // Handle missing data-name attribute
      if (img.dataset.name.toLowerCase().includes(query.toLowerCase())) {
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    });
  }
  

  function filterGridByCondition(condition) {
    const images = imageGrid.getElementsByClassName('grid-image');
    const now = new Date();

    Array.from(images).forEach((img) => {
      const releaseDate = new Date(img.dataset.release);
      const isFavorite = img.dataset.favorite === 'true';

      if (condition === 'all') {
        img.style.display = 'block';
      } else if (condition === 'unreleased' && releaseDate > now) {
        img.style.display = 'block';
      } else if (condition === 'favorite' && isFavorite) {
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    });
  }

  function adjustGridScale(scale) {
    currentScale = scale;
    const images = imageGrid.getElementsByClassName('grid-image');
    Array.from(images).forEach((img) => {
      // img.style.transform = `scale(${scale})`;
      img.style.width = `${150 * scale}px`; // Adjust the width based on scale
      img.style.height = 'auto'; // Maintain aspect ratio
    });
    imageGrid.style.gap = `${10 * scale}px`; // Adjust the gap between images
    imageGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${150 * scale}px, 1fr))`; // Adjust the grid layout
    imageGrid.style.justifyContent = 'start'; // Align items to the start horizontally
    imageGrid.style.alignContent = 'start'; // Align items to the start vertically
  }

  function sortGrid(order) {
    const images = Array.from(imageGrid.getElementsByClassName('grid-image'));

    // Assign release dates to collection items based on the sorting order
    collections.forEach((collection) => {
        const collectionImages = images.filter(img => img.dataset.collection === collection.collection);
        const collectionGames = games.filter(game => game.collection === collection.collection);
        if (collectionGames.length > 0) {
            const releaseDates = collectionGames.map(game => new Date(game.release)).filter(date => !isNaN(date));
            let collectionReleaseDate;
          if (order === 'release-asc') {
            collectionReleaseDate = new Date(Math.min(...releaseDates));
          } else if (order === 'release-desc') {
            collectionReleaseDate = new Date(Math.max(...releaseDates));
          }
          if (!isNaN(collectionReleaseDate)) {
            collectionImages.forEach(img => {
              img.dataset.release = collectionReleaseDate.toISOString().split('T')[0];
            });
          }
        }
      });

    images.sort((a, b) => {
      const nameA = a.dataset.name.toLowerCase();
      const nameB = b.dataset.name.toLowerCase();
      const releaseA = new Date(a.dataset.release);
      const releaseB = new Date(b.dataset.release);

      if (order === 'asc') {
        return nameA.localeCompare(nameB);
      } else if (order === 'desc') {
        return nameB.localeCompare(nameA);
      } else if (order === 'release-asc') {
        return releaseB - releaseA;
      } else if (order === 'release-desc') {
        return releaseA - releaseB;
      }
    });

    images.forEach((img) => {
      imageGrid.appendChild(img);
    });
  }

  function openContextMenu(event, item, isCollection) {
    // Clear previous context menu items
    contextMenu.innerHTML = '';

    // Create and add the appropriate button based on the item's properties
    if (isCollection) {
      console.log('Opening context menu for collection:', item.collection);
      focusedCollection = item.collection;
      // Add the Edit Collection button
      const editcollectionButton = document.createElement('button');
      editcollectionButton.textContent = 'Edit Collection';
      editcollectionButton.style.backgroundColor = settings[0].theme_color2;
      editcollectionButton.style.color = settings[0].font_color;
      editcollectionButton.addEventListener('click', () => {
        openEditCollectionForm(item.collection);
        contextMenu.style.display = 'none';
      });
      contextMenu.appendChild(editcollectionButton);
    } else {
      // Add the Launch button
      const launchButton = document.createElement('button');
      launchButton.textContent = 'Launch';
      launchButton.style.backgroundColor = settings[0].theme_color2;
      launchButton.style.color = settings[0].font_color;
      launchButton.addEventListener('click', () => {
        LaunchGame(item);
        contextMenu.style.display = 'none';
      });
      contextMenu.appendChild(launchButton);
        // Add the edit button
      const editButton = document.createElement('button');
      editButton.textContent = 'Edit Game';
      editButton.style.backgroundColor = settings[0].theme_color2;
      editButton.style.color = settings[0].font_color;
      editButton.addEventListener('click', () => {
        openEditForm(item);
        contextMenu.style.display = 'none';
      });
      contextMenu.appendChild(editButton);

      if (item.favorite === undefined || item.favorite === false) {
        const favoriteButton = document.createElement('button');
        favoriteButton.textContent = 'Mark as Favorite';
        favoriteButton.style.backgroundColor = settings[0].theme_color2;
        favoriteButton.style.color = settings[0].font_color;
        favoriteButton.addEventListener('click', () => {
          item.favorite = true;
          updateFavoriteStatus(item, true);
          contextMenu.style.display = 'none';
          // Update the grid or perform any other necessary actions
        });
        contextMenu.appendChild(favoriteButton);
      } else if (item.favorite === true) {
        const unfavoriteButton = document.createElement('button');
        unfavoriteButton.textContent = 'Unfavorite';
        unfavoriteButton.style.backgroundColor = settings[0].theme_color2;
        unfavoriteButton.style.color = settings[0].font_color;
        unfavoriteButton.addEventListener('click', () => {
          item.favorite = false;
          updateFavoriteStatus(item, false);
          contextMenu.style.display = 'none';
          // Update the grid or perform any other necessary actions
        });
        contextMenu.appendChild(unfavoriteButton);
      }

      if (item.hide === undefined || item.hide === false) {
        console.log('itemhide:', item.hide);
        if (item.sortTitle !== '') {
          console.log('sorttitle:', item.sortTitle);
          // if any other game with the same sort title is not hidden, show the hide button
          const gamesWithSortTitle = games.filter(game => game.sortTitle === item.sortTitle);
          const hiddenGamesWithSortTitle = gamesWithSortTitle.filter(game => game.hide === true);
          if ((gamesWithSortTitle.length - hiddenGamesWithSortTitle.length) > 1) {
            console.log('gamesWithSortTitle:', gamesWithSortTitle);
            console.log('hiddenGamesWithSortTitle:', hiddenGamesWithSortTitle);
            const hideButton = document.createElement('button');
            hideButton.textContent = 'Hide Version';
            hideButton.style.backgroundColor = settings[0].theme_color2;
            hideButton.style.color = settings[0].font_color;
            hideButton.addEventListener('click', () => {
              item.hide = true;
              updateHideStatus(item, true);
              contextMenu.style.display = 'none';
              // Update the grid or perform any other necessary actions
            });
            contextMenu.appendChild(hideButton);
          }
        }
      } else if (item.hide === true) {
        console.log('Adding unhide button', item.hide);
        const unhideButton = document.createElement('button');
        unhideButton.textContent = 'Unhide Version';
        unhideButton.style.backgroundColor = settings[0].theme_color2;
        unhideButton.style.color = settings[0].font_color;
        unhideButton.addEventListener('click', () => {
          item.hide = false;
          updateHideStatus(item, false);
          contextMenu.style.display = 'none';
          // Update the grid or perform any other necessary actions
        });
        contextMenu.appendChild(unhideButton);
      } else {
        console.log('No hide/unhide button added');
      }

      // Add the delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.style.backgroundColor = settings[0].theme_color1;
      deleteButton.style.color = settings[0].font_color;
      deleteButton.addEventListener('click', () => {
        deleteGame(item);
        contextMenu.style.display = 'none';
      });
      contextMenu.appendChild(deleteButton);
    }

    // Position and display the context menu
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.style.display = 'block';
  }

  function updateFavoriteStatus(item, isFavorite) {
    // Update the favorite status in the games array
    games = games.map(game => {
      if (game.name === item.name) {
        return { ...game, favorite: isFavorite };
      }
      return game;
    });

    // Write the updated games array to the games.json file
    window.api.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');

    // Reload the grid to reflect the changes
    // loadInitialGrid();
  }

  function updateHideStatus(item, isHidden) {
    // Update the hide status in the games array
    games = games.map(game => {
      if (game.name === item.name) {
        return { ...game, hide: isHidden };
      }
      return game;
    });

    // Write the updated games array to the games.json file
    window.api.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');

    // Reload the grid to reflect the changes
    // loadInitialGrid();
  }

  function deleteGame(item) {
    // Remove the game from the games array
    games = games.filter(game => game.name !== item.name);

    // Write the updated games array to the games.json file
    window.api.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');

    // Reload the grid to reflect the changes
    loadInitialGrid(currentCollection);
  }

  function LaunchGame(game) {
    console.log('Launching game:', game.name);
  
    // Get the launch path from the game object
    const launchPath = game.launcher;
    console.log('Launch path:', launchPath);
  
    // Use the exposed API to launch the game
    window.api.launchGame(launchPath);
  }

  function openEditCollectionForm(collection) {
    const collectionNameInput = document.getElementById('collectionname');

    // set the collection name in the form
    collectionNameInput.value = collection;

    // set the collection colors in the form
    if (settings[2][collection]) {
      collectionbackground1Input.value = settings[2][collection].theme_color1;
      collectionbackground2Input.value = settings[2][collection].theme_color2;
    } else {
    collectionbackground1Input.value = settings[0].theme_color1;
    collectionbackground2Input.value = settings[0].theme_color2;
    }

    // Hide the collection art preview
    collectionartPreview.style.display = 'none';
    // Show the form
    editCollectionForm.style.display = 'block';
  }

  function openEditForm(game){
    const consoleSelect = document.getElementById('game-console');
    gameForm.name.value = game.name;
    gameForm.sortTitle.value = game.sortTitle || '';
    consoleSelect.value = game.console || '';
    gameForm.release.value = game.release || '';
    gameForm.collection.value = game.collection || '';
    gameForm.launcher.value = game.launcher || '';
    gameForm.boxart.value = game.boxart || '';
    boxartPreview.src = `file://${window.api.join(dirname, '../src/assets/images', game.boxart)}` || defaultBoxartPath;
    boxartPreview.style.display = 'block';

    // Show the form
    addGameForm.style.display = 'block';

    prevBoxartButton.classList.add('hidden');
    nextBoxartButton.classList.add('hidden');
  }

  // Event listener for the "Find Box Art" button
  findBoxartButton.addEventListener('click', async () => {
    await findBoxArt();
    // Show the navigation buttons
    prevBoxartButton.classList.remove('hidden');
    nextBoxartButton.classList.remove('hidden');
  });

  findcollectionartButton.addEventListener('click', async () => {
    await findCollectionArt();
    // Show the navigation buttons
    prevcollectionartButton.classList.remove('hidden');
    nextcollectionartButton.classList.remove('hidden');
  });

  // Event listeners for the box art navigation buttons
  prevBoxartButton.addEventListener('click', () => {
    if (foundGrids.length > 0) {
      focusedGridIndex = (focusedGridIndex - 1 + foundGrids.length) % foundGrids.length;
      boxartPreview.src = foundGrids[focusedGridIndex].url;
    }
  });

  nextBoxartButton.addEventListener('click', () => {
    if (foundGrids.length > 0) {
      focusedGridIndex = (focusedGridIndex + 1) % foundGrids.length;
      boxartPreview.src = foundGrids[focusedGridIndex].url;
    }
  });

   // Event listeners for the box art navigation buttons
   prevcollectionartButton.addEventListener('click', () => {
    if (foundGrids.length > 0) {
      focusedGridIndex = (focusedGridIndex - 1 + foundGrids.length) % foundGrids.length;
      collectionartPreview.src = foundGrids[focusedGridIndex].url;
    }
  });

  nextcollectionartButton.addEventListener('click', () => {
    if (foundGrids.length > 0) {
      focusedGridIndex = (focusedGridIndex + 1) % foundGrids.length;
      collectionartPreview.src = foundGrids[focusedGridIndex].url;
    }
  });

  async function findBoxArt() {
    try {
      console.log('findBoxArt function called');
      const SteamGridKey = settings[1].scraper_steamgriddb_key;
      console.log('SteamGridKey:', SteamGridKey);
      const result = await window.api.searchGame(SteamGridKey, gameForm.name.value);
      console.log('searchGame result:', result);
      console.log(result[0].id);
      const grids = await window.api.getGrids(SteamGridKey, result[0].id);
      console.log('getGrids result:', grids);
      const filteredGrids = grids.filter(grid => grid.width === 600 && grid.height === 900);

      if (filteredGrids.length === 0) {
        console.error("No grids found with the specified dimensions.");
        return;
      }

      // Select the first available grid to display
      focusedGridIndex = 0;
      foundGrids = filteredGrids;

      // Use the selectedGrid as needed
      boxartPreview.src = foundGrids[0].url;
      boxartPreview.style.display = 'block';
    } catch (error) {
      console.error('Error searching for game:', error);
    }
  }

  async function findCollectionArt() {
    try {
      console.log('findCollectionArt function called');
      const SteamGridKey = settings[1].scraper_steamgriddb_key;
      console.log('SteamGridKey:', SteamGridKey);
      const result = await window.api.searchGame(SteamGridKey, collectionFormName.value);
      console.log('searchGame result:', result);
      console.log(result[0].id);
      const grids = await window.api.getGrids(SteamGridKey, result[0].id);
      console.log('getGrids result:', grids);
      const filteredGrids = grids.filter(grid => grid.width === 600 && grid.height === 900);

      if (filteredGrids.length === 0) {
        console.error("No grids found with the specified dimensions.");
        return;
      }

      // Select the first available grid to display
      focusedGridIndex = 0;
      foundGrids = filteredGrids;

      // Use the selectedGrid as needed
      collectionartPreview.src = foundGrids[0].url;
      collectionartPreview.style.display = 'block';
    } catch (error) {
      console.error('Error searching for game:', error);
    }
  }

  // Load the initial grid
  loadInitialGrid(null);

  // Add event listener for the search box
  searchBox.addEventListener('input', (event) => {
    filterGridByName(event.target.value);
  });

  // Add event listener for the zoom slider
  zoomSlider.addEventListener('input', (event) => {
    adjustGridScale(event.target.value);
  });

  // Add event listener for the sort dropdown
  sortDropdown.addEventListener('change', (event) => {
    sortGrid(event.target.value);
  });

//   // Add event listener for the filter dropdown
//   filterCondition.addEventListener('change', (event) => {
//     filterGridByCondition(event.target.value);
// });

  filterCondition.addEventListener('change', (event) => {
    const selectedFilter = event.target.value;

    if (selectedFilter === 'home') {
      // Show the home screen and hide the main grid
      imageGrid.style.display = 'none';
      document.getElementById('home-screen').style.display = 'block';
      loadHomeScreen();
    } else {
      // Show the main grid and hide the home screen
      imageGrid.style.display = 'grid';
      document.getElementById('home-screen').style.display = 'none';
      filterGridByCondition(selectedFilter);
    }
  });

  function loadHomeScreen() {
    const homeScreen = document.getElementById('home-screen');
  
    // Clear existing rows
    homeScreen.innerHTML = `
      <div class="home-row">
        <h2>Recently Played</h2>
        <button class="scroll-left">&lt;</button>
        <div class="row-games"></div>
        <button class="scroll-right">&gt;</button>
      </div>
      <div class="home-row">
        <h2>New Releases</h2>
        <button class="scroll-left">&lt;</button>
        <div class="row-games"></div>
        <button class="scroll-right">&gt;</button>
      </div>
      <div class="home-row">
        <h2>Upcoming</h2>
        <button class="scroll-left">&lt;</button>
        <div class="row-games"></div>
        <button class="scroll-right">&gt;</button>
      </div>
      <div class="home-row">
        <h2>Favorites</h2>
        <button class="scroll-left">&lt;</button>
        <div class="row-games"></div>
        <button class="scroll-right">&gt;</button>
      </div>
    `;
  
    // Populate each row
    populateRow('Recently Played', getRecentlyPlayedGames());
    populateRow('New Releases', getNewReleases());
    populateRow('Upcoming', getUpcomingGames());
    populateRow('Favorites', getFavoriteGames());
  
    // Add event listeners for scroll buttons
    addScrollListeners();
  }

  function getRecentlyPlayedGames() {
    return games
      .filter(game => game.lastplayed) // Filter games with a lastplayed date
      .sort((a, b) => new Date(b.lastplayed) - new Date(a.lastplayed)) // Sort by most recent
      .slice(0, 30); // Limit to 30 games
  }
  
  function getNewReleases() {
    const now = new Date();
    return games
      .filter(game => new Date(game.release) <= now) // Filter released games
      .sort((a, b) => new Date(b.release) - new Date(a.release)) // Sort by newest release
      .slice(0, 30); // Limit to 30 games
  }
  
  function getUpcomingGames() {
    const now = new Date();
    return games
      .filter(game => new Date(game.release) > now) // Filter upcoming games
      .sort((a, b) => new Date(a.release) - new Date(b.release)) // Sort by closest release
      .slice(0, 30); // Limit to 30 games
  }
  
  function getFavoriteGames() {
    return games
      .filter(game => game.favorite) // Filter favorite games
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  }

  function populateRow(title, games) {
    // Find the row with the matching title
    const rows = document.querySelectorAll('.home-row');
    let targetRow = null;
  
    rows.forEach(row => {
      const rowTitle = row.querySelector('h2').textContent;
      if (rowTitle === title) {
        targetRow = row;
      }
    });
  
    if (!targetRow) {
      console.error(`Row with title "${title}" not found.`);
      return;
    }
  
    // Clear existing games in the row
    const rowGames = targetRow.querySelector('.row-games');
    rowGames.innerHTML = '';
  
    //
    // currentScale = scale;
    // const images = imageGrid.getElementsByClassName('grid-image');
    // Array.from(images).forEach((img) => {
    //   // img.style.transform = `scale(${scale})`;
    //   img.style.width = `${150 * scale}px`; // Adjust the width based on scale
    //   img.style.height = 'auto'; // Maintain aspect ratio
    // });
    //

    // Add games to the row
    games.forEach(game => {
      const imgElement = document.createElement('img');
      imgElement.src = `file://${window.api.join(dirname, '../src/assets/images', game.boxart)}`;
      imgElement.onerror = () => {
        imgElement.src = defaultBoxartPath;
      };
      imgElement.style.width = `${150 * currentScale}px`; // Adjust the width based on scale
      imgElement.style.height = 'auto'; // Maintain aspect ratio
      imgElement.dataset.name = game.name || '';
      imgElement.addEventListener('click', () => {
        // Handle game click (e.g., open game details)
        console.log('Clicked game:', game.name);
      });
      rowGames.appendChild(imgElement);
    });

    // hide row if no games are present
    if (games.length === 0) {
      targetRow.style.display = 'none';
    }
  }

  function addScrollListeners() {
    document.querySelectorAll('.home-row').forEach(row => {
      const rowGames = row.querySelector('.row-games');
      const scrollLeft = row.querySelector('.scroll-left');
      const scrollRight = row.querySelector('.scroll-right');
  
      scrollLeft.addEventListener('click', () => {
        rowGames.scrollBy({ left: -1500, behavior: 'smooth' });
      });
  
      scrollRight.addEventListener('click', () => {
        rowGames.scrollBy({ left: 1500, behavior: 'smooth' });
      });
    });
  }

  // Add event listener for right-clicks outside of grid items
  document.addEventListener('contextmenu', (event) => {
    if (!event.target.classList.contains('grid-image')) {
      event.preventDefault();
      loadInitialGrid(null);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (topBar.classList.contains('visible')) {
        topBar.classList.remove('visible');
        imageGrid.style.paddingTop = '20px';
        imageGrid.style.height = '100vh';
      } else {
        topBar.classList.add('visible');
        imageGrid.style.paddingTop = '70px';
        imageGrid.style.height = 'calc(100vh - 70px)';
      }
    }
  });

  document.addEventListener('mousemove', (event) => {
    if (activeElement) {
      activeElement.classList.remove('active');
    }
    activeElement = event.target.closest('.grid-image');
    if (activeElement) {
      activeElement.classList.add('active');
    }
    document.body.classList.remove('hide-cursor');
  });

  let lastInputType = 'mouse';

  function navigateGrid(key) {
    const focusedElement = activeElement || document.querySelector('.grid-image');
    if (!focusedElement) return;

    let newFocusedElement;

    switch (key) {
      case 'w':
      case 'arrowup':
        newFocusedElement = getAdjacentElement(focusedElement, 'up');
        document.body.classList.add('hide-cursor');
        break;
      case 's':
      case 'arrowdown':
        newFocusedElement = getAdjacentElement(focusedElement, 'down');
        document.body.classList.add('hide-cursor');
        break;
      case 'a':
      case 'arrowleft':
        newFocusedElement = getAdjacentElement(focusedElement, 'left');
        document.body.classList.add('hide-cursor');
        break;
      case 'd':
      case 'arrowright':
        newFocusedElement = getAdjacentElement(focusedElement, 'right');
        document.body.classList.add('hide-cursor');
        break;
    }

    if (newFocusedElement) {
      setActiveElement(newFocusedElement);
      newFocusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      lastInputType = 'keyboard';
    }
  }

  function getAdjacentElement(element, direction) {
    const gridItems = Array.from(document.getElementsByClassName('grid-image'));
    const currentIndex = gridItems.indexOf(element);
    const columns = Math.floor(imageGrid.clientWidth / element.clientWidth);

    let newIndex;
    switch (direction) {
      case 'up':
        newIndex = currentIndex - columns;
        break;
      case 'down':
        newIndex = currentIndex + columns;
        break;
      case 'left':
        newIndex = currentIndex - 1;
        break;
      case 'right':
        newIndex = currentIndex + 1;
        break;
    }

    if (newIndex >= 0 && newIndex < gridItems.length) {
      return gridItems[newIndex];
    }
    return null;
  }

  window.addEventListener('gamepadconnected', (event) => {
    console.log('Gamepad connected:', event.gamepad);
    pollGamepad();
  });

  window.addEventListener('gamepaddisconnected', (event) => {
    console.log('Gamepad disconnected:', event.gamepad);
  });

  function pollGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        handleGamepadInput(gamepad);
      }
    }
    requestAnimationFrame(pollGamepad);
  }

  let navigationInterval;
  let lastDirection = null;

  function handleGamepadInput(gamepad) {
    const dpadUp = gamepad.buttons[12].pressed;
    const dpadDown = gamepad.buttons[13].pressed;
    const dpadLeft = gamepad.buttons[14].pressed;
    const dpadRight = gamepad.buttons[15].pressed;
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];

    function startNavigation(direction) {
      if (navigationInterval && lastDirection === direction) {
        return;
      }

      clearInterval(navigationInterval);
      lastDirection = direction;

      document.body.classList.add('hide-cursor');
      navigateGrid(direction);

      navigationInterval = setInterval(() => {
        navigateGrid(direction);
      }, 200); // Adjust the interval as needed
    }

    if (dpadUp || leftStickY < -0.5) {
      startNavigation('arrowup')
    } else if (dpadDown || leftStickY > 0.5) {
      startNavigation('arrowdown')
    } else if (dpadLeft || leftStickX < -0.5) {
      startNavigation('arrowleft')
    } else if (dpadRight || leftStickX > 0.5) {
      startNavigation('arrowright')
    } else {
      clearInterval(navigationInterval);
      lastDirection = null;
    }
  }

  // Poll gamepad input
  function pollGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        handleGamepadInput(gamepad);
      }
    }
    requestAnimationFrame(pollGamepad);
  }

pollGamepad();

  // Hide the context menu when clicking outside of it
  document.addEventListener('click', (event) => {
    if (!contextMenu.contains(event.target)) {
      contextMenu.style.display = 'none';
    }
  });

  // Show the add game form when the "Add Game" button is clicked
  addGameButton.addEventListener('click', () => {
    gameForm.reset();
    boxartPreview.src = defaultBoxartPath;
    document.querySelector('#game-collection').value = currentCollection || '';
    addGameForm.style.display = 'block';
  });

  closeCollectionFormButton.addEventListener('click', () => {
    editCollectionForm.style.display = 'none';
  });

  // Hide the add game form and edit collection form when the close button is clicked
  closeFormButton.addEventListener('click', () => {
    addGameForm.style.display = 'none';
  });

  // Preview the boxart image when the boxart path is entered
  boxartInput.addEventListener('input', () => {
    const boxartPath = boxartInput.value;
    if (boxartPath) {
      boxartPreview.src = `file://${window.api.join(dirname, '../assets/images', boxartPath)}`;
      boxartPreview.style.display = 'block';
    } else {
      boxartPreview.src = defaultBoxartPath;
      boxartPreview.style.display = 'block';
    }
  });

  // Handle the error event for the boxart preview image
  boxartPreview.addEventListener('error', () => {
    boxartPreview.src = defaultBoxartPath;
  });

  // Handle the form submission to save the new game
  saveCollectionButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const oldCollection = focusedCollection;
    const collectionNameInput = document.getElementById('collectionname');
    const collectionName = collectionNameInput.value;
    //console.log('Collection form submitted');
    //
    // if boxartInput.value starts with http or https
    if (collectionartPreview.src.startsWith('http') || collectionartPreview.src.startsWith('https')) {
      await window.api.downloadImage(collectionartPreview.src, window.api.join(dirname, '../src/assets/collections', `${collectionName}.png`));
    }
    //

    // Rename the image in the collections folder to match the new collection name
    console.log("OLD COLLECTION:", oldCollection);
    const oldCollectionPath = window.api.join(dirname, '../src/assets/collections', `${oldCollection}.png`);
    const newCollectionPath = window.api.join(dirname, '../src/assets/collections', `${collectionName}.png`);

    try {
      await window.api.renameFile(oldCollectionPath, newCollectionPath);
    } catch (error) {
      console.error('Error renaming file:', error);
    }

    // Update the collection name in the games array
    games = games.map(game => {
      //console.log("GAME FOUND:", game);
      if (game.collection === oldCollection) {
        //console.log("GAME COLLECTION:", game.collection);
        return { ...game, collection: collectionName };
      }
      return game;
    });

    // Write the updated games array to the games.json file
    console.log("GAMES:", games);
    window.api.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');

    // Update the collection name in the settings array if it exists, otherwise add a new entry
    if (settings[2][collectionName]) {
      settings[2][collectionName].theme_color1 = collectionbackground1Input.value;
      settings[2][collectionName].theme_color2 = collectionbackground2Input.value;
    } else {
      settings[2][collectionName] = {
        theme_color1: collectionbackground1Input.value,
        theme_color2: collectionbackground2Input.value
      };
    }

    window.api.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');

    // Update the image for the collection in the settings array @@@@@

    // Reload the grid to reflect the changes
    loadInitialGrid(currentCollection);
    editCollectionForm.style.display = 'none';
  });

  // Handle the form submission to save the new game
  gameForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Game form submitted');
    // if boxartInput.value starts with http or https
    if (boxartPreview.src.startsWith('http') || boxartPreview.src.startsWith('https')) {
        console.log('Downloading boxart image...');
        await window.api.downloadImage(boxartPreview.src, window.api.join(dirname, '../src/assets/images', `${gameForm.name.value}.png`));
        gameForm.boxart.value = `${gameForm.name.value}.png`;
    }

    const boxartPath = gameForm.boxart.value || 'DEFAULT_BOXART.png';

    const newGame = {
      name: gameForm.name.value,
      sortTitle: gameForm.sortTitle.value,
      console: gameForm.console.value,
      release: gameForm.release.value,
      collection: gameForm.collection.value,
      launcher: gameForm.launcher.value,
      boxart: boxartPath,
      favorite: false
    };

    // Check if the game already exists
    const existingGameIndex = games.findIndex(game => game.name === newGame.name);
    if (existingGameIndex !== -1) {
      // Update the existing game
      games[existingGameIndex] = newGame;
    } else {
      // Add the new game
      games.push(newGame);
    }

    window.api.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');

    addGameForm.style.display = 'none';
    // if currentCollection is not null, reload the grid with the current collection
    if (currentCollection) {
      filterGridByCollection(currentCollection);
    } else {
      loadInitialGrid(currentCollection);
    }
  });

  document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    const key = event.key.toLowerCase();
  
    // Allow typing in input and textarea elements
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      return;
    }
  
    // Prevent default behavior for navigation keys
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      navigateGrid(key);
    }
  
    // Handle navigation
    switch (key) {
      case 'arrowleft':
      case 'a':
        // Handle left navigation
        break;
      case 'arrowright':
      case 'd':
        // Handle right navigation
        break;
      case 'arrowup':
      case 'w':
        // Handle up navigation
        break;
      case 'arrowdown':
      case 's':
        // Handle down navigation
        break;
      default:
        break;
    }
  });
});