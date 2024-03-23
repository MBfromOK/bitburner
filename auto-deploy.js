/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("scp");
  ns.disableLog("scan");
  ns.disableLog("sleep");
  // ns.disableLog("Retrieving");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerNumPortsRequired");
  var debugLevel = 0;
  var pServRamLevel = 4; // 1,2,4,8,16,32,64,128,
  var target = ns.args[0];
  var homeServer = "home";
  var cracks = {
    "BruteSSH.exe": ns.brutessh,
    "FTPCrack.exe": ns.ftpcrack,
    "relaySMTP.exe": ns.relaysmtp,
    "HTTPWorm.exe": ns.httpworm,
    "SQLInject.exe": ns.sqlinject
  };
  var virus = "cr/gimme-money.js";
  var virusRam = ns.getScriptRam(virus);
  function myMoney() {
      return ns.formatNumber(ns.getServerMoneyAvailable("home"));
  }
  function getNumCracks() {
    return Object.keys(cracks).filter(function(file) {
      return ns.fileExists(file, homeServer);
    }).length;
  }
  function penetrate(server) {
    if (debugLevel > 0){
      ns.print("Penetrating " + server);
    }
    for (var file of Object.keys(cracks)) {
      if (ns.fileExists(file, homeServer)) {
        var runScript = cracks[file];
        runScript(server);
      }
    }
  }
  async function copyAndRunVirus(server) {
    if (debugLevel > 0){
      ns.print("Copying virus to server: " + server);
    }
    await ns.scp(virus, server);
    if (!ns.hasRootAccess(target)) {
      var requiredPorts = ns.getServerNumPortsRequired(target);
      if (requiredPorts > 0) {
        penetrate(target);
      }
      if (debugLevel > 1){
        ns.print("Gaining root access on target:" + target);
      }
      ns.nuke(target);
    }
    if (!ns.hasRootAccess(server)) {
      var requiredPorts = ns.getServerNumPortsRequired(server);
      if (requiredPorts > 0) {
        penetrate(server);
      }
      if (debugLevel > 0){
        ns.print("Gaining root access on " + server);
      }
      ns.nuke(server);
    }
    if (ns.scriptRunning(virus, server)) {
      ns.scriptKill(virus, server);
    }
    var maxThreads = Math.floor(ns.getServerMaxRam(server) / virusRam);
    if (server == "home") {
      var maxThreads = Math.floor((ns.getServerMaxRam(server) * .75) / virusRam);
    }
    ns.exec(virus, server, maxThreads, target);
  }
  function getNetworkNodes() {
    if (debugLevel > 0){
      ns.print("Retrieving all nodes in the network");
    }
    var visited = {};
    var stack = [];
    var origin = ns.getHostname();
    stack.push(origin);
    while (stack.length > 0) {
      var node = stack.pop();
      if (!visited[node]) {
        visited[node] = node;
        var neighbours = ns.scan(node);
        for (var i = 0; i < neighbours.length; i++) {
          var child = neighbours[i];
          if (visited[child]) {
            continue;
          }
          stack.push(child);
        }
      }
    }
    var currentPurchasedServers = ns.getPurchasedServers();
    for (let i = 0; i < currentPurchasedServers; i++) {
      stack.push(currentPurchasedServers[i]);
    }
    return Object.keys(visited);
  }
  function canHack(server) {
    var numCracks = getNumCracks();
    var reqPorts = ns.getServerNumPortsRequired(server);
    var ramAvail = ns.getServerMaxRam(server);
    return numCracks >= reqPorts && ramAvail > virusRam;
  }
  function getTargetServers() {
    var networkNodes = getNetworkNodes();
    const targets = networkNodes.filter(function(node) {
      if (node.includes("pserv-")) {
        return true;
      } else {
        return canHack(node);
      }
    });
    return targets;
  }
  async function deployHacks(targets) {
    if (debugLevel > 0){
      ns.tprint("Gonna deploy virus to these servers " + targets);
    }
    for (var serv of targets) {
      await copyAndRunVirus(serv);
      await ns.sleep(50);
    }
  }
  var curTargets = [];
  var waitTime = 10;
  while (true) {
    if (myMoney > 5000000000) {
      scriptKill = true
      return false
    };
    var newTargets = getTargetServers();
    if (newTargets.length !== curTargets.length) {
      await deployHacks(newTargets);
      curTargets = newTargets;
    }
    await ns.sleep(waitTime);
  }
}
