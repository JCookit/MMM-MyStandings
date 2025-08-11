const Log = require('logger')
const NodeHelper = require('node_helper')
const fs = require('node:fs')
const path = require('node:path')

module.exports = NodeHelper.create({
  start: function () {
    Log.log('Starting node_helper for: ' + this.name)
    this.dataTimers = {} // Store timers per module instance
    this.pendingFetches = {} // Track pending data fetches per module
  },

  getDirectoryTree(dirPath) {
    const result = []
    const files = fs.readdirSync(dirPath, { withFileTypes: true })

    files.forEach((file) => {
      const filePath = path.join(dirPath, file.name)
      if (file.name.endsWith('.svg') || file.name.endsWith('.png')) {
        result.push({ name: file.name })
      }
      else if (file.isDirectory()) {
        const children = this.getDirectoryTree(filePath)
        if (children.length > 0) {
          result.push({ name: file.name, children })
        }
      }
    })

    return result
  },

  async getData(notification, payload) {
    try {
      Log.info(`[MMM-MyStandings-Helper] Fetching: ${payload.url} for uniqueID: ${payload.uniqueID}`)
      const response = await fetch(payload.url)
      Log.info(`[MMM-MyStandings-Helper] ${payload.url} fetched - status: ${response.status}, ok: ${response.ok}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      Log.info(`[MMM-MyStandings-Helper] Parsed JSON for ${payload.uniqueID}, data structure:`, {
        hasChildren: !!data.children,
        childrenCount: data.children ? data.children.length : 0,
        hasStandings: data.children ? data.children.some(child => child.standings) : false
      })
      Log.info(`[MMM-MyStandings-Helper] Sending ${notification} for ${payload.uniqueID}`)
      this.sendSocketNotification(notification, {
        result: data,
        uniqueID: payload.uniqueID,
      })
      
      // Track completion
      this.handleFetchComplete(payload.uniqueID)
      Log.info(`[MMM-MyStandings-Helper] Completed processing for ${payload.uniqueID}`)
    }
    catch (error) {
      Log.error(`[MMM-MyStandings-Helper] Could not load data from ${payload.url}: ${error}`)
      this.handleFetchComplete(payload.uniqueID)
    }
  },

  async getSNETData(notification, payload) {
    var queryYear = new Date().getFullYear()
    var standings = []
    while (standings.length === 0 && queryYear > 2020) {
      try {
        const response = await fetch(payload.url + queryYear)
        Log.debug(`[MMM-MyStandings] ${payload.url} fetched`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data['data']['teams']) {
          standings = data['data']['teams']
        }
        if (standings.length === 0) {
          queryYear = queryYear - 1
        }
      }
      catch (error) {
        Log.error(`[MMM-MyStandings] Could not load data: ${error}`)
      }
    }
    this.sendSocketNotification(`STANDINGS_RESULT_SNET-${queryYear}_${notification.split('-')[1]}`, {
      result: standings,
      uniqueID: payload.uniqueID,
    })
    
    // Track completion
    this.handleFetchComplete(payload.uniqueID)
  },

  handleFetchComplete: function(uniqueID) {
    if (this.pendingFetches[uniqueID]) {
      this.pendingFetches[uniqueID]--
      
      Log.info(`[MMM-MyStandings-Helper] Fetch completed for ${uniqueID}, remaining: ${this.pendingFetches[uniqueID]}`)
      
      if (this.pendingFetches[uniqueID] <= 0) {
        Log.info(`[MMM-MyStandings-Helper] All data fetched for ${uniqueID} - sending completion notification`)
        this.sendSocketNotification('MMM-MYSTANDINGS-ALL-DATA-RECEIVED', { uniqueID })
        delete this.pendingFetches[uniqueID]
      }
    } else {
      Log.warn(`[MMM-MyStandings-Helper] No pending fetches found for ${uniqueID}`)
    }
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived: function (notification, payload) {
    Log.info(`[MMM-MyStandings-Helper] Received: ${notification} for ${payload.uniqueID}`)
    
    if (notification == 'MMM-MYSTANDINGS-GET-LOCAL-LOGOS') {
      Log.info(`[MMM-MyStandings-Helper] Getting local logos for ${payload.uniqueID}`)
      this.localLogos = {}
      var fsTree = this.getDirectoryTree('./modules/MMM-MyStandings/logos')
      fsTree.forEach((league) => {
        if (league.children) {
          var logoFiles = []
          league.children.forEach((file) => {
            logoFiles.push(file.name)
          })
          this.localLogos[league.name] = logoFiles
        }
      })

      this.localLogosCustom = {}
      fsTree = this.getDirectoryTree('./modules/MMM-MyStandings/logos_custom')
      fsTree.forEach((league) => {
        if (league.children) {
          var logoFiles = []
          league.children.forEach((file) => {
            logoFiles.push(file.name)
          })
          this.localLogosCustom[league.name] = logoFiles
        }
      })

      this.sendSocketNotification('MMM-MYSTANDINGS-LOCAL-LOGO-LIST', { uniqueID: payload.uniqueID, logos: this.localLogos, logosCustom: this.localLogosCustom })
      Log.info(`[MMM-MyStandings-Helper] Sent local logos for ${payload.uniqueID}`)
    }
    else if (notification === 'MMM-MYSTANDINGS-START-DATA-TIMER') {
      Log.info(`[MMM-MyStandings-Helper] Starting data timer for ${payload.uniqueID}`)
      this.startDataTimer(payload)
    }
    else if (notification === 'MMM-MYSTANDINGS-STOP-DATA-TIMER') {
      Log.info(`[MMM-MyStandings-Helper] Stopping data timer for ${payload.uniqueID}`)
      this.stopDataTimer(payload.uniqueID)
    }
    else if (notification === 'MMM-MYSTANDINGS-FETCH-DATA') {
      Log.info(`[MMM-MyStandings-Helper] Manual data fetch requested for ${payload.uniqueID}`)
      this.fetchAllData(payload)
    }
    else if (payload.url && payload.url.includes('stats-api.sportsnet.ca/web_standings')) {
      Log.info(`[MMM-MyStandings-Helper] Fetching SNET data: ${notification}`)
      this.getSNETData(notification, payload)
    }
    else if (notification.startsWith('STANDINGS_RESULT')) {
      Log.info(`[MMM-MyStandings-Helper] Fetching ESPN data: ${notification}`)
      this.getData(notification, payload)
    }
    else {
      Log.warn(`[MMM-MyStandings-Helper] Unknown notification: ${notification}`)
    }
  },

  startDataTimer: function(config) {
    const uniqueID = config.uniqueID
    
    // Stop existing timer if any
    this.stopDataTimer(uniqueID)
    
    Log.info(`[MMM-MyStandings] Starting data timer for ${uniqueID}`)
    
    // Fetch data immediately
    this.fetchAllData(config)
    
    // Set up recurring timer
    this.dataTimers[uniqueID] = setInterval(() => {
      Log.info(`[MMM-MyStandings] Timer triggered data fetch for ${uniqueID}`)
      this.fetchAllData(config)
    }, config.updateInterval)
  },

  stopDataTimer: function(uniqueID) {
    if (this.dataTimers[uniqueID]) {
      clearInterval(this.dataTimers[uniqueID])
      delete this.dataTimers[uniqueID]
      Log.info(`[MMM-MyStandings] Stopped data timer for ${uniqueID}`)
    }
  },

  fetchAllData: function(config) {
    const uniqueID = config.uniqueID
    
    // Initialize pending counter for this fetch
    this.pendingFetches[uniqueID] = 0
    
    Log.info(`[MMM-MyStandings-Helper] Starting data fetch for ${uniqueID}, sports:`, config.sports)
    
    // Count total URLs to fetch
    let totalUrls = 0
    
    for (var i = 0; i < config.sports.length; i++) {
      var sportUrls = this.getSportUrls(config.sports[i], config)
      Log.info(`[MMM-MyStandings-Helper] Sport ${config.sports[i].league} generated ${sportUrls.length} URLs`)
      totalUrls += sportUrls.length
      
      // Fetch each URL for this sport
      sportUrls.forEach((url, index) => {
        this.pendingFetches[uniqueID]++
        
        Log.info(`[MMM-MyStandings-Helper] Queuing fetch ${this.pendingFetches[uniqueID]}: ${url}`)
        
        // Determine the notification suffix based on URL type
        let notificationSuffix = config.sports[i].league
        if (url.includes('view=playoff')) {
          notificationSuffix = config.sports[i].league + '_PLAYOFFS'
        } else if (url.includes('view=wild-card')) {
          notificationSuffix = config.sports[i].league + '_WILDCARD'
        }
        
        if (url.includes('stats-api.sportsnet.ca/web_standings')) {
          this.getSNETData(`STANDINGS_RESULT_SNET-${notificationSuffix}`, { url, uniqueID })
        } else {
          this.getData(`STANDINGS_RESULT-${notificationSuffix}`, { url, uniqueID })
        }
      })
    }
    
    Log.info(`[MMM-MyStandings-Helper] Queued ${totalUrls} total URLs for ${uniqueID}, pending count: ${this.pendingFetches[uniqueID]}`)
  },

  getSportUrls: function(sport, config) {
    const url = 'https://site.api.espn.com/apis/v2/sports/'
    const urlRanking = 'https://site.api.espn.com/apis/site/v2/sports/'
    var sportUrls = []
    
    Log.info(`[MMM-MyStandings-Helper] Generating URLs for sport: ${sport.league}, groups:`, sport.groups)
    
    // Sport group mappings (moved from frontend)
    const mlb_l1 = ['Major League Baseball']
    const mlb_l2 = ['American League', 'National League']
    const mlb_l3 = ['American League East', 'American League Central', 'American League West', 'National League East', 'National League Central', 'National League West']
    const mlb_wc = ['AL Wild Card', 'NL Wild Card']
    const mlb_po = ['AL Playoffs', 'NL Playoffs']
    
    const nba_l1 = ['National Basketball Association']
    const nba_l2 = ['Western Conference', 'Eastern Conference']
    const nba_l3 = ['Atlantic', 'Central', 'Southeast', 'Northwest', 'Pacific', 'Southwest']
    
    const nfl_l1 = ['National Football League']
    const nfl_l2 = ['American Football Conference', 'National Football Conference']
    const nfl_l3 = ['AFC East', 'AFC North', 'AFC South', 'AFC West', 'NFC East', 'NFC North', 'NFC South', 'NFC West']
    const nfl_po = ['AFC Playoffs', 'NFC Playoffs']
    
    const nhl_l1 = ['National Hockey League']
    const nhl_l2 = ['Western Conference', 'Eastern Conference']
    const nhl_l3 = ['Atlantic Division', 'Metropolitan Division', 'Central Division', 'Pacific Division']
    const nhl_wc = ['West Wild Card', 'East Wild Card']
    const nhl_po = ['West Playoffs', 'East Playoffs']
    
    switch (sport.league) {
      case 'MLB':
        if (sport.groups && mlb_l1.some(item => sport.groups.includes(item))) {
          const mlbUrl = url + 'baseball/mlb/standings?level=1&sort=gamesbehind:asc,winpercent:desc,playoffseed:asc'
          sportUrls.push(mlbUrl)
          Log.info(`[MMM-MyStandings-Helper] Added MLB L1 URL: ${mlbUrl}`)
        }
        if (sport.groups && mlb_l2.some(item => sport.groups.includes(item))) {
          const mlbUrl = url + 'baseball/mlb/standings?level=2&sort=gamesbehind:asc,winpercent:desc,playoffseed:asc'
          sportUrls.push(mlbUrl)
          Log.info(`[MMM-MyStandings-Helper] Added MLB L2 URL: ${mlbUrl}`)
        }
        if (sport.groups && mlb_wc.some(item => sport.groups.includes(item))) {
          const mlbUrl = url + 'baseball/mlb/standings?view=wild-card&type=1&level=2&sort=gamesbehind:asc,winpercent:desc,playoffseed:asc&startingseason=2024&seasontype=2'
          sportUrls.push(mlbUrl)
          Log.info(`[MMM-MyStandings-Helper] Added MLB WC URL: ${mlbUrl}`)
        }
        if (sport.groups && mlb_po.some(item => sport.groups.includes(item))) {
          const mlbUrl = url + 'baseball/mlb/standings?view=playoff&level=2&sort=playoffseed:asc'
          sportUrls.push(mlbUrl)
          Log.info(`[MMM-MyStandings-Helper] Added MLB PO URL: ${mlbUrl}`)
        }
        if (!sport.groups || mlb_l3.some(item => sport.groups.includes(item))) {
          const mlbUrl = url + 'baseball/mlb/standings?level=3&sort=gamesbehind:asc,winpercent:desc'
          sportUrls.push(mlbUrl)
          Log.info(`[MMM-MyStandings-Helper] Added MLB L3 URL: ${mlbUrl}`)
        }
        break
      case 'NBA':
        if (sport.groups && nba_l1.some(item => sport.groups.includes(item))) {
          const nbaUrl = url + 'basketball/nba/standings?level=1&sort=gamesbehind:asc,winpercent:desc'
          sportUrls.push(nbaUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NBA L1 URL: ${nbaUrl}`)
        }
        if (sport.groups && nba_l2.some(item => sport.groups.includes(item))) {
          const nbaUrl = url + 'basketball/nba/standings?level=2&sort=gamesbehind:asc,winpercent:desc,playoffseed:asc'
          sportUrls.push(nbaUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NBA L2 URL: ${nbaUrl}`)
        }
        if (!sport.groups || nba_l3.some(item => sport.groups.includes(item))) {
          const nbaUrl = url + 'basketball/nba/standings?level=3&sort=gamesbehind:asc,winpercent:desc'
          sportUrls.push(nbaUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NBA L3 URL: ${nbaUrl}`)
        }
        break
      case 'NFL':
        if (sport.groups && nfl_l1.some(item => sport.groups.includes(item))) {
          const nflUrl = url + 'football/nfl/standings?level=1&sort=winpercent:desc,playoffseed:asc'
          sportUrls.push(nflUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NFL L1 URL: ${nflUrl}`)
        }
        if (sport.groups && nfl_l2.some(item => sport.groups.includes(item))) {
          const nflUrl = url + 'football/nfl/standings?level=2&sort=winpercent:desc,playoffseed:asc'
          sportUrls.push(nflUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NFL L2 URL: ${nflUrl}`)
        }
        if (sport.groups && nfl_po.some(item => sport.groups.includes(item))) {
          const nflUrl = url + 'football/nfl/standings?view=playoff&sort=playoffseed:asc'
          sportUrls.push(nflUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NFL PO URL: ${nflUrl}`)
        }
        if (!sport.groups || nfl_l3.some(item => sport.groups.includes(item))) {
          const nflUrl = url + 'football/nfl/standings?level=3&sort=winpercent:desc,playoffseed:asc'
          sportUrls.push(nflUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NFL L3 URL: ${nflUrl}`)
        }
        break
      case 'NHL':
        if (sport.groups && nhl_l1.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?level=1&sort=points:desc,winpercent:desc,playoffseed:asc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL L1 URL: ${nhlUrl}`)
        }
        if (sport.groups && nhl_l2.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?level=2&sort=points:desc,winpercent:desc,playoffseed:asc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL L2 URL: ${nhlUrl}`)
        }
        if (sport.groups && nhl_wc.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?view=wild-card&level=2&sort=points:desc,winpercent:desc,playoffseed:asc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL WC URL: ${nhlUrl}`)
        }
        if (sport.groups && nhl_po.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?view=playoff&sort=playoffseed:asc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL PO URL: ${nhlUrl}`)
        }
        if (!sport.groups || nhl_l3.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?level=3&sort=points:desc,winpercent:desc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL L3 URL: ${nhlUrl}`)
        }
        break
      default:
        // For now, fallback to a basic URL
        const fallbackUrl = url + 'baseball/mlb/standings?level=3&sort=gamesbehind:asc,winpercent:desc'
        sportUrls.push(fallbackUrl)
        Log.warn(`[MMM-MyStandings-Helper] Unknown sport ${sport.league}, using fallback URL: ${fallbackUrl}`)
    }
    
    Log.info(`[MMM-MyStandings-Helper] Generated ${sportUrls.length} URLs for ${sport.league}:`, sportUrls)
    return sportUrls
  },
})
