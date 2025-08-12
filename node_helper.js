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

  // Soccer and rugby league paths for ESPN API
  SOCCER_LEAGUE_PATHS: {
    'AFC Champions League Two': 'soccer/afc.cup', 'AFC Asian Cup Qualifiers': 'soccer/afc.cupq', 'ASEAN Championship': 'soccer/aff.championship', 'Africa Cup of Nations': 'soccer/caf.nations', 'Africa Cup of Nations Qualifying': 'soccer/caf.nations_qual', 'African Nations Championship': 'soccer/caf.championship', 'Copa América': 'soccer/conmebol.america', 'FIFA Club World Cup': 'soccer/fifa.cwc', 'FIFA Confederations Cup': 'soccer/fifa.confederations', 'Men\'s Olympic Soccer Tournament': 'soccer/fifa.olympics', 'Women\'s Olympic Soccer Tournament': 'soccer/fifa.w.olympics', 'FIFA Women\'s World Cup': 'soccer/fifa.wwc', 'FIFA World Cup': 'soccer/fifa.world', 'FIFA World Cup Qualifying - AFC': 'soccer/fifa.worldq.afc', 'FIFA World Cup Qualifying - CAF': 'soccer/fifa.worldq.caf', 'FIFA World Cup Qualifying - Concacaf': 'soccer/fifa.worldq.concacaf', 'FIFA World Cup Qualifying - CONMEBOL': 'soccer/fifa.worldq.conmebol', 'FIFA World Cup Qualifying - OFC': 'soccer/fifa.worldq.ofc', 'FIFA World Cup Qualifying - UEFA': 'soccer/fifa.worldq.uefa', 'FIFA Under-17 World Cup': 'soccer/fifa.world.u17', 'FIFA Under-20 World Cup': 'soccer/fifa.world.u20', 'UEFA Champions League': 'soccer/uefa.champions', 'UEFA Conference League': 'soccer/uefa.europa.conf', 'UEFA Europa League': 'soccer/uefa.europa', 'UEFA European Championship': 'soccer/uefa.euro', 'UEFA European Championship Qualifying': 'soccer/uefa.euroq', 'UEFA European Under-19 Championship': 'soccer/uefa.euro.u19', 'UEFA European Under-21 Championship': 'soccer/uefa.euro_u21', 'UEFA Nations League': 'soccer/uefa.nations', 'SAFF Championship': 'soccer/afc.saff.championship', 'UEFA Women\'s European Championship': 'soccer/uefa.weuro', 'English League Championship': 'soccer/eng.2', 'English EFL Trophy': 'soccer/eng.trophy', 'English League One': 'soccer/eng.3', 'English League Two': 'soccer/eng.4', 'English National League': 'soccer/eng.5', 'English Premier League': 'soccer/eng.1', 'Irish Premier Division': 'soccer/irl.1', 'Northern Irish Premiership': 'soccer/nir.1', 'Scottish League Cup': 'soccer/sco.cis', 'Scottish Championship': 'soccer/sco.2', 'Scottish League One': 'soccer/sco.3', 'Scottish League Two': 'soccer/sco.4', 'Scottish Premiership': 'soccer/sco.1', 'Welsh Premier League': 'soccer/wal.1', 'English Women\'s Super League': 'soccer/eng.w.1', 'Austrian Bundesliga': 'soccer/aut.1', 'Belgian Pro League': 'soccer/bel.1', 'Danish Superliga': 'soccer/den.1', 'Spanish LALIGA': 'soccer/esp.1', 'Spanish LALIGA 2': 'soccer/esp.2', 'French Ligue 1': 'soccer/fra.1', 'French Ligue 2': 'soccer/fra.2', 'German 2. Bundesliga': 'soccer/ger.2', 'German Bundesliga': 'soccer/ger.1', 'Greek Super League': 'soccer/gre.1', 'Israeli Premier League': 'soccer/isr.1', 'Italian Serie A': 'soccer/ita.1', 'Italian Serie B': 'soccer/ita.2', 'Maltese Premier League': 'soccer/mlt.1', 'Dutch Keuken Kampioen Divisie': 'soccer/ned.2', 'Dutch Eredivisie': 'soccer/ned.1', 'Norwegian Eliteserien': 'soccer/nor.1', 'Portuguese Primeira Liga': 'soccer/por.1', 'Romanian Liga 1': 'soccer/rou.1', 'Russian Premier League': 'soccer/rus.1', 'Swiss Super League': 'soccer/sui.1', 'Swedish Allsvenskan': 'soccer/swe.1', 'Turkish Super Lig': 'soccer/tur.1', 'Copa Argentina': 'soccer/arg.copa', 'Argentine Nacional B': 'soccer/arg.2', 'Argentine Primera B': 'soccer/arg.3', 'Argentine Primera C': 'soccer/arg.4', 'Argentine Primera D': 'soccer/arg.5', 'Argentine Liga Profesional de Fútbol': 'soccer/arg.1', 'Bolivian Liga Profesional': 'soccer/bol.1', 'Brazilian Campeonato Carioca': 'soccer/bra.camp.carioca', 'Brazilian Campeonato Gaucho': 'soccer/bra.camp.gaucho', 'Brazilian Campeonato Mineiro': 'soccer/bra.camp.mineiro', 'Brazilian Campeonato Paulista': 'soccer/bra.camp.paulista', 'Brazilian Serie A': 'soccer/bra.1', 'Brazilian Serie B': 'soccer/bra.2', 'Brazilian Serie C': 'soccer/bra.3', 'Chilean Primera División': 'soccer/chi.1', 'Colombian Primera A': 'soccer/col.1', 'Colombian Primera B': 'soccer/col.2', 'CONMEBOL Libertadores': 'soccer/conmebol.libertadores', 'CONMEBOL Sudamericana': 'soccer/conmebol.sudamericana', 'LigaPro Ecuador': 'soccer/ecu.1', 'Paraguayan Primera División': 'soccer/par.1', 'Peruvian Liga 1': 'soccer/per.1', 'Liga UAF Uruguaya': 'soccer/uru.1', 'Venezuelan Primera División': 'soccer/ven.1', 'Concacaf Gold Cup': 'soccer/concacaf.gold', 'Concacaf Nations League': 'soccer/concacaf.nations.league', 'Concacaf Nations League Qualifying': 'soccer/concacaf.nations.league_qual', 'Concacaf W Championship': 'soccer/concacaf.womens.championship', 'Costa Rican Primera Division': 'soccer/crc.1', 'Guatemalan Liga Nacional': 'soccer/gua.1', 'Honduran Liga Nacional': 'soccer/hon.1', 'Jamaican Premier League': 'soccer/jam.1', 'Mexican Liga de Expansión MX': 'soccer/mex.2', 'Mexican Copa MX': 'soccer/mex.copa_mx', 'Mexican Liga BBVA MX': 'soccer/mex.1', 'Salvadoran Primera Division': 'soccer/slv.1', 'MLS': 'soccer/usa.1', 'NCAA Men\'s Soccer': 'soccer/usa.ncaa.m.1', 'NCAA Women\'s Soccer': 'soccer/usa.ncaa.w.1', 'North American Soccer League': 'soccer/usa.nasl', 'NWSL': 'soccer/usa.nwsl', 'U.S. Open Cup': 'soccer/usa.open', 'USL Championship': 'soccer/usa.usl.1', 'AFC Champions League Elite': 'soccer/afc.champions', 'Australian A-League Men': 'soccer/aus.1', 'Australian A-League Women': 'soccer/aus.w.1', 'Chinese Super League': 'soccer/chn.1', 'Indonesian Liga 1': 'soccer/idn.1', 'Indian I-League': 'soccer/ind.2', 'Indian Super League': 'soccer/ind.1', 'Japanese J.League': 'soccer/jpn.1', 'Malaysian Super League': 'soccer/mys.1', 'Singaporean Premier League': 'soccer/sgp.1', 'Thai League 1': 'soccer/tha.1', 'CAF Champions League': 'soccer/caf.champions', 'CAF Confederation Cup': 'soccer/caf.confed', 'Ghanaian Premier League': 'soccer/gha.1', 'Kenyan Premier League': 'soccer/ken.1', 'Nigerian Professional League': 'soccer/nga.1', 'South African First Division': 'soccer/rsa.2', 'South African Premier Division': 'soccer/rsa.1', 'Ugandan Premier League': 'soccer/uga.1', 'Zambian Super League': 'soccer/zam.1', 'Zimbabwean Premier Soccer League': 'soccer/zim.1', 'Premiership Rugby': 'rugby/267979', 'Rugby World Cup': 'rugby/164205', 'Six Nations': 'rugby/180659', 'The Rugby Championship': 'rugby/244293', 'European Rugby Champions Cup': 'rugby/271937', 'United Rugby Championship': 'rugby/270557', 'Super Rugby Pacific': 'rugby/242041', 'Olympic Men\'s 7s': 'rugby/282', 'Olympic Women\'s Rugby Sevens': 'rugby/283', 'International Test Match': 'rugby/289234', 'URBA Top 12': 'rugby/289279', 'Mitre 10 Cup': 'rugby/270563',
    // Legacy mappings for backwards compatibility
    'AFC_ASIAN_CUP': 'soccer/afc.cup', 'AFC_ASIAN_CUP_Q': 'soccer/afc.cupq', 'AFF_CUP': 'soccer/aff.championship', 'AFR_NATIONS_CUP': 'soccer/caf.nations', 'AFR_NATIONS_CUP_Q': 'soccer/caf.nations_qual', 'AFR_NATIONS_CHAMPIONSHIP': 'soccer/caf.championship', 'CONMEBOL_COPA_AMERICA': 'soccer/conmebol.america', 'FIFA_CLUB_WORLD_CUP': 'soccer/fifa.cwc', 'FIFA_CONFEDERATIONS_CUP': 'soccer/fifa.confederations', 'FIFA_MENS_OLYMPICS': 'soccer/fifa.olympics', 'FIFA_WOMENS_OLYMPICS': 'soccer/fifa.w.olympics', 'FIFA_WOMENS_WORLD_CUP': 'soccer/fifa.wwc', 'FIFA_WORLD_CUP': 'soccer/fifa.world', 'FIFA_WORLD_CUP_Q_AFC': 'soccer/fifa.worldq.afc', 'FIFA_WORLD_CUP_Q_CAF': 'soccer/fifa.worldq.caf', 'FIFA_WORLD_CUP_Q_CONCACAF': 'soccer/fifa.worldq.concacaf', 'FIFA_WORLD_CUP_Q_CONMEBOL': 'soccer/fifa.worldq.conmebol', 'FIFA_WORLD_CUP_Q_OFC': 'soccer/fifa.worldq.ofc', 'FIFA_WORLD_CUP_Q_UEFA': 'soccer/fifa.worldq.uefa', 'FIFA_WORLD_U17': 'soccer/fifa.world.u17', 'FIFA_WORLD_U20': 'soccer/fifa.world.u20', 'UEFA_CHAMPIONS': 'soccer/uefa.champions', 'UEFA_CONFERENCE_LEAGUE': 'soccer/uefa.europa.conf', 'UEFA_EUROPA': 'soccer/uefa.europa', 'UEFA_EUROPEAN_CHAMPIONSHIP': 'soccer/uefa.euro', 'UEFA_EUROPEAN_CHAMPIONSHIP_Q': 'soccer/uefa.euroq', 'UEFA_EUROPEAN_CHAMPIONSHIP_U19': 'soccer/uefa.euro.u19', 'UEFA_EUROPEAN_CHAMPIONSHIP_U21': 'soccer/uefa.euro_u21', 'UEFA_NATIONS': 'soccer/uefa.nations', 'SAFF_CHAMPIONSHIP': 'soccer/afc.saff.championship', 'WOMENS_EUROPEAN_CHAMPIONSHIP': 'soccer/uefa.weuro', 'ENG_CHAMPIONSHIP': 'soccer/eng.2', 'ENG_EFL': 'soccer/eng.trophy', 'ENG_LEAGUE_1': 'soccer/eng.3', 'ENG_LEAGUE_2': 'soccer/eng.4', 'ENG_NATIONAL': 'soccer/eng.5', 'ENG_PREMIERE_LEAGUE': 'soccer/eng.1', 'IRL_PREM': 'soccer/irl.1', 'NIR_PREM': 'soccer/nir.1', 'SCO_CIS': 'soccer/sco.cis', 'SCO_CHAMPIONSHIP': 'soccer/sco.2', 'SCO_LEAGUE_1': 'soccer/sco.3', 'SCO_LEAGUE_2': 'soccer/sco.4', 'SCO_PREM': 'soccer/sco.1', 'WAL_PREM': 'soccer/wal.1', 'AUT_BUNDESLIGA': 'soccer/aut.1', 'BEL_DIV_A': 'soccer/bel.1', 'DEN_SAS_LIGAEN': 'soccer/den.1', 'ESP_LALIGA': 'soccer/esp.1', 'ESP_SEGUNDA_DIV': 'soccer/esp.2', 'FRA_LIGUE_1': 'soccer/fra.1', 'FRA_LIGUE_2': 'soccer/fra.2', 'GER_2_BUNDESLIGA': 'soccer/ger.2', 'GER_BUNDESLIGA': 'soccer/ger.1', 'GRE_SUPER_LEAGUE': 'soccer/gre.1', 'ISR_PREMIER_LEAGUE': 'soccer/isr.1', 'ITA_SERIE_A': 'soccer/ita.1', 'ITA_SERIE_B': 'soccer/ita.2', 'MLT_PREMIER_LEAGUE': 'soccer/mlt.1', 'NED_EERSTE_DIVISIE': 'soccer/ned.2', 'NED_EREDIVISIE': 'soccer/ned.1', 'NOR_ELITESERIEN': 'soccer/nor.1', 'POR_LIGA': 'soccer/por.1', 'ROU_FIRST_DIV': 'soccer/rou.1', 'RUS_PREMIER_LEAGUE': 'soccer/rus.1', 'SUI_SUPER_LEAGUE': 'soccer/sui.1', 'SWE_ALLSVENSKANLIGA': 'soccer/swe.1', 'TUR_SUPER_LIG': 'soccer/tur.1', 'ARG_COPA': 'soccer/arg.copa', 'ARG_NACIONAL_B': 'soccer/arg.2', 'ARG_PRIMERA_DIV_B': 'soccer/arg.3', 'ARG_PRIMERA_DIV_C': 'soccer/arg.4', 'ARG_PRIMERA_DIV_D': 'soccer/arg.5', 'ARG_SUPERLIGA': 'soccer/arg.1', 'BOL_LIGA_PRO': 'soccer/bol.1', 'BRA_CAMP_CARIOCA': 'soccer/bra.camp.carioca', 'BRA_CAMP_GAUCHO': 'soccer/bra.camp.gaucho', 'BRA_CAMP_MINEIRO': 'soccer/bra.camp.mineiro', 'BRA_CAMP_PAULISTA': 'soccer/bra.camp.paulista', 'BRA_SERIE_A': 'soccer/bra.1', 'BRA_SERIE_B': 'soccer/bra.2', 'BRA_SERIE_C': 'soccer/bra.3', 'CHI_PRIMERA_DIV': 'soccer/chi.1', 'COL_PRIMERA_A': 'soccer/col.1', 'COL_PRIMERA_B': 'soccer/col.2', 'CONMEBOL_COPA_LIBERTADORES': 'soccer/conmebol.libertadores', 'CONMEBOL_COPA_SUDAMERICANA': 'soccer/conmebol.sudamericana', 'ECU_PRIMERA_A': 'soccer/ecu.1', 'PAR_PRIMERA_DIV': 'soccer/par.1', 'PER_PRIMERA_PRO': 'soccer/per.1', 'URU_PRIMERA_DIV': 'soccer/uru.1', 'VEN_PRIMERA_PRO': 'soccer/ven.1', 'CONCACAF_GOLD_CUP': 'soccer/concacaf.gold', 'CONCACAF_NATIONS_LEAGUE': 'soccer/concacaf.nations.league', 'CONCACAF_NATIONS_Q': 'soccer/concacaf.nations.league_qual', 'CONCACAF_WOMENS_CHAMPIONSHIP': 'soccer/concacaf.womens.championship', 'CRC_PRIMERA_DIV': 'soccer/crc.1', 'GUA_LIGA_NACIONAL': 'soccer/gua.1', 'HON_PRIMERA_DIV': 'soccer/hon.1', 'JAM_PREMIER_LEAGUE': 'soccer/jam.1', 'MEX_ASCENSO_MX': 'soccer/mex.2', 'MEX_COPA_MX': 'soccer/mex.copa_mx', 'MEX_LIGA_BANCOMER': 'soccer/mex.1', 'SLV_PRIMERA_DIV': 'soccer/slv.1', 'USA_MLS': 'soccer/usa.1', 'USA_NCAA_SL_M': 'soccer/usa.ncaa.m.1', 'USA_NCAA_SL_W': 'soccer/usa.ncaa.w.1', 'USA_NASL': 'soccer/usa.nasl', 'USA_NWSL': 'soccer/usa.nwsl', 'USA_OPEN': 'soccer/usa.open', 'USA_USL': 'soccer/usa.usl.1', 'AFC_CHAMPIONS': 'soccer/afc.champions', 'AUS_A_LEAGUE': 'soccer/aus.1', 'CHN_SUPER_LEAGUE': 'soccer/chn.1', 'IDN_SUPER_LEAGUE': 'soccer/idn.1', 'IND_I_LEAGUE': 'soccer/ind.2', 'IND_SUPER_LEAGUE': 'soccer/ind.1', 'JPN_J_LEAGUE': 'soccer/jpn.1', 'MYS_SUPER_LEAGUE': 'soccer/mys.1', 'SGP_PREMIER_LEAGUE': 'soccer/sgp.1', 'THA_PREMIER_LEAGUE': 'soccer/tha.1', 'CAF_CHAMPIONS': 'soccer/caf.champions', 'CAF_CONFED_CUP': 'soccer/caf.confed', 'GHA_PREMIERE_LEAGUE': 'soccer/gha.1', 'KEN_PREMIERE_LEAGUE': 'soccer/ken.1', 'NGA_PRO_LEAGUE': 'soccer/nga.1', 'RSA_FIRST_DIV': 'soccer/rsa.2', 'RSA_PREMIERSHIP': 'soccer/rsa.1', 'UGA_SUPER_LEAGUE': 'soccer/uga.1', 'ZAM_SUPER_LEAGUE': 'soccer/zam.1', 'ZIM_PREMIER_LEAGUE': 'soccer/zim.1', 'Six Nations Rugby': 'rugby/180659', 'Olympic Men\'s 7s Rugby': 'rugby/282', 'International Test Match Rugby': 'rugby/289234', 'URBA Top 12 Rugby': 'rugby/289279', 'Mitre 10 Cup Rugby': 'rugby/270563',
  },

  // Check if current date is within the specified date range
  isDateInRange: function(fromDate, toDate, fakeDate) {
    if (!fromDate && !toDate) {
      return true // No date restriction
    }
    
    fromDate = fromDate || '01-01'
    toDate = toDate || '12-31'
    
    let current
    if (fakeDate) {
      // Use fake date for testing
      const parsed = this.parseMMDD(fakeDate)
      current = {
        month: parsed.month,
        day: parsed.day
      }
      Log.info(`[MMM-MyStandings-Helper] Using fake date for testing: ${fakeDate} (${current.month}/${current.day})`)
    } else {
      // Use real current date
      const now = new Date()
      current = {
        month: now.getMonth() + 1,
        day: now.getDate()
      }
    }
    
    const from = this.parseMMDD(fromDate)
    const to = this.parseMMDD(toDate)
    
    // Helper function to convert month/day to comparable number (MMDD)
    const toComparableNumber = (monthDay) => monthDay.month * 100 + monthDay.day
    
    const currentComparable = toComparableNumber(current)
    const fromComparable = toComparableNumber(from)
    const toComparable = toComparableNumber(to)
    
    if (fromComparable <= toComparable) {
      // Normal range (e.g., 03-01 to 11-01)
      return currentComparable >= fromComparable && currentComparable <= toComparable
    } else {
      // Wrap-around range (e.g., 10-01 to 03-31)
      return currentComparable >= fromComparable || currentComparable <= toComparable
    }
  },

  // Parse MM-DD format string to month/day object
  parseMMDD: function(dateStr) {
    if (!dateStr) return { month: 1, day: 1 }
    
    const parts = dateStr.split('-')
    return {
      month: parseInt(parts[0], 10) || 1,
      day: parseInt(parts[1], 10) || 1
    }
  },

  // Check if a sport should be active based on league and group date ranges
  isSportActive: function(sport, fakeDate) {
    // Check league-level dates first
    if (!this.isDateInRange(sport.from, sport.to, fakeDate)) {
      return false
    }
    
    // If no groups, sport is active based on league dates only
    if (!sport.groups || sport.groups.length === 0) {
      return true
    }
    
    // Check if any group is active (groups can be strings or objects with date ranges)
    return sport.groups.some(group => {
      if (typeof group === 'string') {
        // String group inherits league dates
        return true // Already checked league dates above
      } else if (typeof group === 'object' && group.name) {
        // Object group with potential date override
        const groupFrom = group.from || sport.from
        const groupTo = group.to || sport.to
        return this.isDateInRange(groupFrom, groupTo, fakeDate)
      }
      return false
    })
  },

  // Get active groups for a sport (only groups that are in date range)
  getActiveGroups: function(sport, fakeDate) {
    if (!sport.groups || sport.groups.length === 0) {
      return []
    }
    
    return sport.groups.filter(group => {
      if (typeof group === 'string') {
        // String group uses league dates
        return this.isDateInRange(sport.from, sport.to, fakeDate)
      } else if (typeof group === 'object' && group.name) {
        // Object group with potential date override
        const groupFrom = group.from || sport.from
        const groupTo = group.to || sport.to
        return this.isDateInRange(groupFrom, groupTo, fakeDate)
      }
      return false
    }).map(group => {
      // Normalize to group name string for URL generation
      return typeof group === 'string' ? group : group.name
    })
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
    const fakeDate = config.useFakeDate
    
    // Notify frontend that data fetch is starting (clears old data)
    this.sendSocketNotification('MMM-MYSTANDINGS-DATA-FETCH-START', { uniqueID })
    
    // Initialize pending counter for this fetch
    this.pendingFetches[uniqueID] = 0
    
    Log.info(`[MMM-MyStandings-Helper] Starting data fetch for ${uniqueID}, sports:`, config.sports)
    if (fakeDate) {
      Log.info(`[MMM-MyStandings-Helper] Using fake date for testing: ${fakeDate}`)
    }
    
    // Filter sports based on date ranges
    const activeSports = config.sports.filter(sport => this.isSportActive(sport, fakeDate))
    
    Log.info(`[MMM-MyStandings-Helper] Date filtering: ${config.sports.length} configured sports, ${activeSports.length} active for ${fakeDate ? `fake date ${fakeDate}` : 'current date'}`)
    
    if (activeSports.length === 0) {
      Log.info(`[MMM-MyStandings-Helper] No sports active for ${fakeDate ? `fake date ${fakeDate}` : 'current date'}, sending empty data`)
      this.sendSocketNotification('MMM-MYSTANDINGS-ALL-DATA-RECEIVED', { uniqueID })
      return
    }
    
    // Count total URLs to fetch
    let totalUrls = 0
    
    for (var i = 0; i < activeSports.length; i++) {
      // Create a modified sport config with only active groups
      const sportWithActiveGroups = {
        ...activeSports[i],
        groups: this.getActiveGroups(activeSports[i], fakeDate)
      }
      
      Log.info(`[MMM-MyStandings-Helper] Sport ${sportWithActiveGroups.league}: ${activeSports[i].groups?.length || 0} configured groups, ${sportWithActiveGroups.groups.length} active groups`)
      
      var sportUrls = this.getSportUrls(sportWithActiveGroups, config)
      Log.info(`[MMM-MyStandings-Helper] Sport ${sportWithActiveGroups.league} generated ${sportUrls.length} URLs`)
      totalUrls += sportUrls.length
      
      // Fetch each URL for this sport
      sportUrls.forEach((url, index) => {
        this.pendingFetches[uniqueID]++
        
        Log.info(`[MMM-MyStandings-Helper] Queuing fetch ${this.pendingFetches[uniqueID]}: ${url}`)
        
        // Determine the notification suffix based on URL type
        let notificationSuffix = sportWithActiveGroups.league
        if (url.includes('view=playoff')) {
          notificationSuffix = sportWithActiveGroups.league + '_PLAYOFFS'
        } else if (url.includes('view=wild-card')) {
          notificationSuffix = sportWithActiveGroups.league + '_WILDCARD'
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
          const nhlUrl = url + 'hockey/nhl/standings?view=wild-card&type=3&level=2&sort=playoffseed%3Aasc%2Cpoints%3Adesc%2Cgamesplayed%3Aasc%2Crotwins%3Adesc&seasontype=2'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL WC URL: ${nhlUrl}`)
        }
        if (sport.groups && nhl_po.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?view=playoff&level=2&sort=playoffseed:asc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL PO URL: ${nhlUrl}`)
        }
        if (!sport.groups || nhl_l3.some(item => sport.groups.includes(item))) {
          const nhlUrl = url + 'hockey/nhl/standings?level=3&sort=points:desc,winpercent:desc,playoffseed:asc'
          sportUrls.push(nhlUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NHL L3 URL: ${nhlUrl}`)
        }
        break
      case 'MLS':
        const mlsUrl = url + 'soccer/usa.1/standings?sort=rank:asc'
        sportUrls.push(mlsUrl)
        Log.info(`[MMM-MyStandings-Helper] Added MLS URL: ${mlsUrl}`)
        break
      case 'NCAAF':
        const ncaafUrl = url + 'football/college-football/standings?group=80&level=3&sort=leaguewinpercent:desc,vsconf_wins:desc,vsconf_gamesbehind:asc,vsconf_playoffseed:asc,wins:desc,losses:desc,playoffseed:asc,alpha:asc'
        sportUrls.push(ncaafUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NCAAF URL: ${ncaafUrl}`)
        break
      case 'NCAAM':
        const ncaamUrl = url + 'basketball/mens-college-basketball/standings?group=50&sort=playoffseed:asc,vsconf_winpercent:desc,vsconf_wins:desc,vsconf_losses:asc,vsconf_gamesbehind:asc&includestats=playoffseed,vsconf,vsconf_gamesbehind,vsconf_winpercent,total,winpercent,home,road,streak,vsaprankedteams,vsusarankedteams'
        sportUrls.push(ncaamUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NCAAM URL: ${ncaamUrl}`)
        break
      case 'NCAAW':
        const ncaawUrl = url + 'basketball/womens-college-basketball/standings?group=50&sort=playoffseed:asc,vsconf_winpercent:desc,vsconf_wins:desc,vsconf_losses:asc,vsconf_gamesbehind:asc&includestats=playoffseed,vsconf,vsconf_gamesbehind,vsconf_winpercent,total,winpercent,home,road,streak,vsaprankedteams,vsusarankedteams'
        sportUrls.push(ncaawUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NCAAW URL: ${ncaawUrl}`)
        break
      case 'NCAAF Rankings':
        const urlRanking = 'https://site.api.espn.com/apis/site/v2/sports/'
        const ncaafRankingsUrl = urlRanking + 'football/college-football/rankings'
        sportUrls.push(ncaafRankingsUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NCAAF Rankings URL: ${ncaafRankingsUrl}`)
        break
      case 'NCAAM Rankings':
        const urlRanking2 = 'https://site.api.espn.com/apis/site/v2/sports/'
        const ncaamRankingsUrl = urlRanking2 + 'basketball/mens-college-basketball/rankings'
        sportUrls.push(ncaamRankingsUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NCAAM Rankings URL: ${ncaamRankingsUrl}`)
        break
      case 'NCAAW Rankings':
        const urlRanking3 = 'https://site.api.espn.com/apis/site/v2/sports/'
        const ncaawRankingsUrl = urlRanking3 + 'basketball/womens-college-basketball/rankings'
        sportUrls.push(ncaawRankingsUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NCAAW Rankings URL: ${ncaawRankingsUrl}`)
        break
      case 'WNBA':
        // Define WNBA groups
        const wnba_l1 = ['Women\'s National Basketball Assoc.']
        const wnba_l2 = ['Eastern Conference', 'Western Conference']
        
        if (sport.groups && wnba_l1.some(item => sport.groups.includes(item))) {
          const wnbaUrl = url + 'basketball/wnba/standings?level=1&sort=gamesbehind:asc,winpercent:desc'
          sportUrls.push(wnbaUrl)
          Log.info(`[MMM-MyStandings-Helper] Added WNBA L1 URL: ${wnbaUrl}`)
        }
        if (!sport.groups || wnba_l2.some(item => sport.groups.includes(item))) {
          const wnbaUrl = url + 'basketball/wnba/standings?level=2&sort=gamesbehind:asc,winpercent:desc,playoffseed:asc'
          sportUrls.push(wnbaUrl)
          Log.info(`[MMM-MyStandings-Helper] Added WNBA L2 URL: ${wnbaUrl}`)
        }
        break
      case 'NBAG':
        // Define NBA G League groups
        const nbag_l1 = ['NBA Development League']
        const nbag_l2 = ['Eastern Conference', 'Western Conference']
        
        if (sport.groups && nbag_l1.some(item => sport.groups.includes(item))) {
          const nbagUrl = url + 'basketball/nba-development/standings?level=1&sort=gamesbehind:asc,winpercent:desc'
          sportUrls.push(nbagUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NBAG L1 URL: ${nbagUrl}`)
        }
        if (!sport.groups || nbag_l2.some(item => sport.groups.includes(item))) {
          const nbagUrl = url + 'basketball/nba-development/standings?level=2&sort=gamesbehind:asc,winpercent:desc,playoffseed:asc'
          sportUrls.push(nbagUrl)
          Log.info(`[MMM-MyStandings-Helper] Added NBAG L2 URL: ${nbagUrl}`)
        }
        break
      case 'AFL':
        const aflUrl = url + 'australian-football/afl/standings?&sort=rank:asc'
        sportUrls.push(aflUrl)
        Log.info(`[MMM-MyStandings-Helper] Added AFL URL: ${aflUrl}`)
        break
      case 'PLL':
        const pllUrl = url + 'lacrosse/pll/standings?sort=winPercentage:desc'
        sportUrls.push(pllUrl)
        Log.info(`[MMM-MyStandings-Helper] Added PLL URL: ${pllUrl}`)
        break
      case 'NLL':
        const nllUrl = url + 'lacrosse/nll/standings?sort=winPercentage:desc'
        sportUrls.push(nllUrl)
        Log.info(`[MMM-MyStandings-Helper] Added NLL URL: ${nllUrl}`)
        break
      case 'Olympics':
        const olympicsUrl = 'https://stats-api.sportsnet.ca/web_standings?league=oly&season_year='
        sportUrls.push(olympicsUrl)
        Log.info(`[MMM-MyStandings-Helper] Added Olympics URL: ${olympicsUrl}`)
        break
      case 'CFL':
        const cflUrl = 'https://stats-api.sportsnet.ca/web_standings?league=cfl&season_year='
        sportUrls.push(cflUrl)
        Log.info(`[MMM-MyStandings-Helper] Added CFL URL: ${cflUrl}`)
        break
      default:
        // Check if it's a soccer or rugby league
        if (this.SOCCER_LEAGUE_PATHS[sport.league]) {
          const soccerUrl = url + this.SOCCER_LEAGUE_PATHS[sport.league] + '/standings?sort=rank:asc'
          sportUrls.push(soccerUrl)
          Log.info(`[MMM-MyStandings-Helper] Added soccer/rugby URL for ${sport.league}: ${soccerUrl}`)
        } else {
          // Unknown sport - log warning but don't add any URLs
          Log.warn(`[MMM-MyStandings-Helper] Unknown sport: ${sport.league}. No URLs generated.`)
        }
    }
    
    Log.info(`[MMM-MyStandings-Helper] Generated ${sportUrls.length} URLs for ${sport.league}:`, sportUrls)
    return sportUrls
  },
})
