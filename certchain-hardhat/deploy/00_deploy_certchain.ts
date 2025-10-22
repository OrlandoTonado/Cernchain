import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const deployed = await deploy("CertChainRegistry", {
    from: deployer,
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 2 : 0,
  });

  console.log("CertChainRegistry deployed at:", deployed.address);
};

export default func;
func.id = "deploy_certchain";
func.tags = ["CertChain"];



