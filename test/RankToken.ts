import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import hre, { deployments } from 'hardhat';
import { AdrSetupResult, EnvSetupResult, RInstanceSettings, setupAddresses, setupTest } from './utils';
import { RankifyDiamondInstance, RankToken } from '../types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Wallet } from 'ethers';
import addDistribution from '../scripts/playbooks/addDistribution';
import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import { DistributorArgumentsStruct } from '../types/src/distributions/MAODistribution.sol/MAODistribution';

let adr: AdrSetupResult;
let env: EnvSetupResult;
let rankifyInstance: RankifyDiamondInstance;
let rankToken: RankToken;

describe('Rank Token Test', async function () {
  beforeEach(async function () {
    const setup = await setupTest();
    adr = setup.adr;
    env = setup.env;

    await addDistribution(hre)(await getCodeIdFromArtifact(hre)('MAODistribution'), adr.gameOwner.wallet);
    const distributorArguments: DistributorArgumentsStruct = {
      DAOSEttings: {
        daoURI: 'https://example.com/dao',
        subdomain: 'example',
        metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
        tokenName: 'tokenName',
        tokenSymbol: 'tokenSymbol',
      },
      ACIDSettings: {
        RankTokenContractURI: 'https://example.com/rank',
        gamePrice: RInstanceSettings.RInstance_GAME_PRICE,
        joinGamePrice: RInstanceSettings.RInstance_JOIN_GAME_PRICE,
        maxPlayersSize: RInstanceSettings.RInstance_MAX_PLAYERS,
        maxTurns: RInstanceSettings.RInstance_MAX_TURNS,
        metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
        minPlayersSize: RInstanceSettings.RInstance_MIN_PLAYERS,
        paymentToken: env.rankifyToken.address,
        rankTokenURI: 'https://example.com/rank',
        timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
        timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
        voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
      },
    };
    // const abi = import('../abi/src/distributions/MAODistribution.sol/MAODistribution.json');
    // Encode the arguments
    const data = ethers.utils.defaultAbiCoder.encode(
      [
        'tuple(tuple(string daoURI, string subdomain, bytes metadata, string tokenName, string tokenSymbol) DAOSEttings, tuple(uint256 timePerTurn, uint256 maxPlayersSize, uint256 minPlayersSize, uint256 timeToJoin, uint256 maxTurns, uint256 voteCredits, uint256 gamePrice, address paymentToken, uint256 joinGamePrice, string metadata, string rankTokenURI, string RankTokenContractURI) ACIDSettings)',
      ],
      [distributorArguments],
    );
    const maoCode = await hre.ethers.provider.getCode(env.maoDistribution.address);
    const maoId = ethers.utils.keccak256(maoCode);
    const distributorsDistId = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['bytes32', 'address'], [maoId, ethers.constants.AddressZero]),
    );
    await env.distributor.instantiate(distributorsDistId, data);
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

    rankToken = (await ethers.getContractAt('RankToken', evts[0].args.instances[13])) as RankToken;
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
