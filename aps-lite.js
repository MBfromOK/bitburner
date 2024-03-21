/**
*  Originally created by chrisrabe for his YouTube Channel and shared via GitHub:
*  Github: https://github.com/chrisrabe/bitburner-automation
*  YouTube: https://www.youtube.com/channel/UCXVoS73T7gn9h4PHghPxpuw
*
* Auto purchase server (lite version)
* Only cares about purchasing the server
* Does not deploy scripts
* @param {NS} ns 
*
**/
 export async function main(ns) {
  ns.disableLog("ALL");
  //ns.enableLog();
  var homeServ = "home";
	var pRam = ns.args[0] ?? 8; // purchased ram
	var servPrefix = "pserv-";

	var maxRam = ns.getPurchasedServerMaxRam();
	var maxServers = ns.getPurchasedServerLimit();

	function canPurchaseServer() {
		return ns.getServerMoneyAvailable(homeServ) > ns.getPurchasedServerCost(pRam);
	}

	async function upgradeServer(server) {
		var sRam = ns.getServerMaxRam(server);
		if (sRam < pRam) {
			while (!canPurchaseServer()) {
				ns.printf("Upgrade (%s RAM): Need $: %s . Have $ %s",pRam, ns.formatNumber(ns.getPurchasedServerCost(pRam)), ns.formatNumber(ns.getServerMoneyAvailable(homeServ)))
        await ns.sleep(10000); // wait 10s
			}
			ns.killall(server);
			//ns.deleteServer(server);
			ns.upgradePurchasedServer(server, pRam);
		}
	}

	async function purchaseServer(server) {
		while (!canPurchaseServer()) {
			ns.printf("Purchase (%s RAM): Need $: %s . Have $ %s", pRam, ns.formatNumber(ns.getPurchasedServerCost(pRam)), ns.formatNumber(ns.getServerMoneyAvailable(homeServ)))
      await ns.sleep(10000); // wait 10s
		}
		ns.purchaseServer(server, pRam);
	}

	async function autoUpgradeServers() {
		var i = 0;
		while (i < maxServers) {
			var server = servPrefix + i;
			if (ns.serverExists(server)) {
				ns.print("Upgrading server " + server + " to " + pRam + "GB");
				await upgradeServer(server);
				++i;
			} else {
				ns.print("Purchasing server " + server + " at " + pRam + "GB");
				await purchaseServer(server, pRam);
				++i;
			}
		}
	}

	while (true) {
		await autoUpgradeServers();
		ns.tprintf("SUCCESS Upgraded all servers to " + pRam + "GB");
		if (pRam === maxRam) {
			break;
		}
		// move up to next tier
		var newRam = pRam * 2;
		ns.tprintf("newRam > maxRam:" + toString(newRam > maxRam))
    if (newRam > maxRam) {
			pRam = maxRam;
		} else {
			pRam = newRam;
		}
	}
}
