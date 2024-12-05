import { ethers, getNamedAccounts, network } from 'hardhat';
import { expect } from 'chai';
import hre, { deployments } from 'hardhat';
import { AdrSetupResult, EnvSetupResult, RInstanceSettings, setupTest } from './utils';
import { RankifyDiamondInstance, RankToken, Rankify } from '../types';
import addDistribution from '../scripts/playbooks/addDistribution';
import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import { MAODistribution } from '../types/src/distributions/MAODistribution';
import generateDistributorData from '../scripts/libraries/generateDistributorData';

let adr: AdrSetupResult;
let env: EnvSetupResult;
let rankifyInstance: RankifyDiamondInstance;
let rankToken: RankToken;

describe('Rank Token Test', async function () {
  beforeEach(async function () {
    const setup = await setupTest();
    adr = setup.adr;
    env = setup.env;

    await addDistribution(hre)({
      distrId: await getCodeIdFromArtifact(hre)('MAODistribution'),
      signer: adr.gameOwner.wallet,
    });
    const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
      tokenSettings: {
        tokenName: 'tokenName',
        tokenSymbol: 'tokenSymbol',
      },
      rankifySettings: {
        rankTokenContractURI: 'https://example.com/rank',
        principalCost: RInstanceSettings.PRINCIPAL_COST,
        principalTimeConstant: RInstanceSettings.PRINCIPAL_TIME_CONSTANT,
        metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
        rankTokenURI: 'https://example.com/rank',
      },
    };
    // Use generateDistributorData to encode the arguments
    const data = generateDistributorData(distributorArguments);
    const maoCode = await hre.ethers.provider.getCode(env.maoDistribution.address);
    const maoId = ethers.utils.keccak256(maoCode);

    const token = await deployments.get('Rankify');
    const { owner } = await getNamedAccounts();
    const oSigner = await ethers.getSigner(owner);
    const tokenContract = new ethers.Contract(token.address, token.abi, oSigner) as Rankify;
    await tokenContract.mint(oSigner.address, ethers.utils.parseEther('100'));
    await tokenContract.approve(env.distributor.address, ethers.constants.MaxUint256);
    const distributorsDistId = await hre.run('defaultDistributionId');
    if (!distributorsDistId) throw new Error('Distribution name not found');
    if (typeof distributorsDistId !== 'string') throw new Error('Distribution name must be a string');
    await env.distributor.connect(oSigner).instantiate(distributorsDistId, data);
    const filter = env.distributor.filters.Instantiated();
    const evts = await env.distributor.queryFilter(filter);
    rankifyInstance = (await ethers.getContractAt(
      'RankifyDiamondInstance',
      evts[0].args.instances[3],
    )) as RankifyDiamondInstance;
    await network.provider.send('hardhat_setBalance', [rankifyInstance.address, '0x9000000000000000000']);
    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken
      .connect(adr.gameCreator2.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken
      .connect(adr.gameCreator3.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player1.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player2.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player3.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player4.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player5.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player6.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player7.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player8.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player9.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken.connect(adr.player10.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);

    rankToken = (await ethers.getContractAt('RankToken', evts[0].args.instances[11])) as RankToken;
  });
  //   it('Allows only owner to set rankingInstance', async () => {
  //     await expect(rankToken.connect(deployer).updateRankingInstance(adr.gameCreator1.wallet.address))
  //       .to.emit(env, 'RankingInstanceUpdated')
  //       .withArgs(adr.gameCreator1.wallet.address);
  //     await expect(rankToken.connect(adr.maliciousActor1.wallet).updateRankingInstance(adr.gameCreator1.wallet.address))
  //       .to.emit(env, 'RankingInstanceUpdated')
  //       .revertedWithCustomError(env, 'OwnableUnauthorizedAccount');
  //   });
  describe('when ranking instance set and tokens are minted to player', async () => {
    beforeEach(async () => {
      //   await rankToken.connect(deployer).updateRankingInstance(rankingInstance.address);
      const impersonatedSigner = await ethers.getImpersonatedSigner(rankifyInstance.address);
      await rankToken.connect(impersonatedSigner).mint(adr.player1.wallet.address, 3, 1, '0x');
    });
    it('Can be locked only by instance', async () => {
      const impersonatedSigner = await ethers.getImpersonatedSigner(rankifyInstance.address);
      await expect(rankToken.connect(impersonatedSigner).lock(adr.player1.wallet.address, 1, 1))
        .to.emit(rankToken, 'TokensLocked')
        .withArgs(adr.player1.wallet.address, 1, 1);
      await expect(
        rankToken.connect(adr.maliciousActor1.wallet).lock(adr.player1.wallet.address, 1, 1),
      ).to.be.revertedWithCustomError(env.distributor, 'InvalidInstance');
    });
    it('Cannot lock more then user has', async () => {
      const impersonatedSigner = await ethers.getImpersonatedSigner(rankifyInstance.address);
      await expect(
        rankToken.connect(impersonatedSigner).lock(adr.player1.wallet.address, 1, 4),
      ).to.be.revertedWithCustomError(rankToken, 'insufficient');
    });

    describe('When tokens locked', async () => {
      beforeEach(async () => {
        await rankToken
          .connect(await ethers.getImpersonatedSigner(rankifyInstance.address))
          .lock(adr.player1.wallet.address, 1, 1);
      });
      it('reports correct balance of unlocked', async () => {
        expect(
          (
            await rankToken.connect(adr.maliciousActor1.wallet).unlockedBalanceOf(adr.player1.wallet.address, 1)
          ).toNumber(),
        ).to.be.equal(2);
      });
      it('Can be unlocked only by a rankingInstance', async () => {
        await expect(
          rankToken
            .connect(await ethers.getImpersonatedSigner(rankifyInstance.address))
            .unlock(adr.player1.wallet.address, 1, 1),
        )
          .to.emit(rankToken, 'TokensUnlocked')
          .withArgs(adr.player1.wallet.address, 1, 1);
        await expect(
          rankToken.connect(adr.maliciousActor1.wallet).unlock(adr.player1.wallet.address, 1, 1),
        ).to.be.revertedWithCustomError(env.distributor, 'InvalidInstance');
      });
      it('Can only unlock a locked amount tokens', async () => {
        await expect(
          rankToken
            .connect(await ethers.getImpersonatedSigner(rankifyInstance.address))
            .unlock(adr.player1.wallet.address, 1, 1),
        )
          .to.emit(rankToken, 'TokensUnlocked')
          .withArgs(adr.player1.wallet.address, 1, 1);
        await expect(
          rankToken
            .connect(await ethers.getImpersonatedSigner(rankifyInstance.address))
            .unlock(adr.player1.wallet.address, 2, 1),
        ).to.be.revertedWithCustomError(rankToken, 'insufficient');
      });
      it('Can transfer only unlocked tokens', async () => {
        await expect(
          rankToken
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 3, '0x'),
        ).to.be.revertedWithCustomError(rankToken, 'insufficient');
        await expect(
          rankToken
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 2, '0x'),
        ).to.be.emit(rankToken, 'TransferSingle');
      });
      it('Can transfer previously locked tokens', async () => {
        await rankToken
          .connect(await ethers.getImpersonatedSigner(rankifyInstance.address))
          .unlock(adr.player1.wallet.address, 1, 1);
        await expect(
          rankToken
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 3, '0x'),
        ).to.be.emit(rankToken, 'TransferSingle');
      });
      it('Balance still shows same', async () => {
        expect(
          (
            await rankToken
              .connect(await ethers.getImpersonatedSigner(rankifyInstance.address))
              .balanceOf(adr.player1.wallet.address, 1)
          ).toNumber(),
        ).to.be.equal(3);
      });
      it('Cannot lock more then balance tokens', async () => {
        await expect(
          rankToken
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 4, '0x'),
        ).to.be.revertedWithCustomError(rankToken, 'insufficient');
      });
    });
  });
});
