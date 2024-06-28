import { ethers } from 'hardhat';
import { expect } from 'chai';
import hre, { deployments } from 'hardhat';
import { AdrSetupResult, setupAddresses } from './utils';
import { RankToken } from '../types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Wallet } from 'ethers';

let adr: AdrSetupResult;
let env: RankToken;
let deployer: SignerWithAddress;
let rankingInstance: SignerWithAddress | Wallet;

const setupTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers: _eth }, options) => {
  const adr = await setupAddresses(getNamedAccounts, _eth);
  const { deployer } = await hre.getNamedAccounts();

  await adr.contractDeployer.wallet.sendTransaction({
    to: deployer,
    value: _eth.utils.parseEther('1'),
  });
  await deployments.fixture(['rank_token']);

  const deployment = await deployments.get('RankToken');
  env = (await ethers.getContractAt(deployment.abi, deployment.address)) as RankToken;
  const rankingInstance = adr.gameCreator1.wallet;
  return { adr, env, deployer, rankingInstance };
});

describe('Rank Token Test', async function () {
  beforeEach(async function () {
    const setup = await setupTest();
    env = setup.env;
    adr = setup.adr;
    rankingInstance = setup.rankingInstance;
    deployer = await hre.ethers.getSigner(await hre.getNamedAccounts().then(acs => acs.deployer));
  });
  it('Allows only owner to set rankingInstance', async () => {
    await expect(env.connect(deployer).updateRankingInstance(adr.gameCreator1.wallet.address))
      .to.emit(env, 'RankingInstanceUpdated')
      .withArgs(adr.gameCreator1.wallet.address);
    await expect(env.connect(adr.maliciousActor1.wallet).updateRankingInstance(adr.gameCreator1.wallet.address))
      .to.emit(env, 'RankingInstanceUpdated')
      .revertedWithCustomError(env, 'OwnableUnauthorizedAccount');
  });
  describe('when ranking instance set and tokens are minted to player', async () => {
    beforeEach(async () => {
      await env.connect(deployer).updateRankingInstance(rankingInstance.address);
      await env.connect(rankingInstance).mint(adr.player1.wallet.address, 3, 1, '0x');
    });
    it('Can be locked only by instance', async () => {
      await expect(env.connect(rankingInstance).lock(adr.player1.wallet.address, 1, 1))
        .to.emit(env, 'TokensLocked')
        .withArgs(adr.player1.wallet.address, 1, 1);
      await expect(env.connect(adr.maliciousActor1.wallet).lock(adr.player1.wallet.address, 1, 1)).to.be.revertedWith(
        'only ranking contract can do that',
      );
    });
    it('Cannot lock more then user has', async () => {
      await expect(env.connect(rankingInstance).lock(adr.player1.wallet.address, 1, 4)).to.be.revertedWith(
        'insufficient',
      );
    });
    // it.only('Returns rank of top token', async () => {
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(1);
    //   await env
    //     .connect(adr.player1.wallet)
    //     .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 3, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(0);
    //   await env.connect(rankingInstance).mint(adr.player1.wallet.address, 1, 30, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(30);
    //   await env.connect(rankingInstance).mint(adr.player1.wallet.address, 1, 25, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(30);
    //   await env.connect(rankingInstance).mint(adr.player1.wallet.address, 1, 40, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(40);
    //   await env.connect(rankingInstance).mint(adr.player1.wallet.address, 1, 50, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(50);
    //   await env
    //     .connect(adr.player1.wallet)
    //     .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 40, 1, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(50);
    //   await env
    //     .connect(adr.player1.wallet)
    //     .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 50, 1, '0x');
    //   expect((await env.connect(adr.player1.wallet).rank(adr.player1.wallet.address)).toNumber()).to.be.equal(30);
    // });

    describe('When tokens locked', async () => {
      beforeEach(async () => {
        await env.connect(rankingInstance).lock(adr.player1.wallet.address, 1, 1);
      });
      it('reports correct balance of unlocked', async () => {
        expect(
          (await env.connect(adr.maliciousActor1.wallet).unlockedBalanceOf(adr.player1.wallet.address, 1)).toNumber(),
        ).to.be.equal(2);
      });
      it('Can be unlocked only by a rankingInstance', async () => {
        await expect(env.connect(rankingInstance).unlock(adr.player1.wallet.address, 1, 1))
          .to.emit(env, 'TokensUnlocked')
          .withArgs(adr.player1.wallet.address, 1, 1);
        await expect(
          env.connect(adr.maliciousActor1.wallet).unlock(adr.player1.wallet.address, 1, 1),
        ).to.be.revertedWith('only ranking contract can do that');
      });
      it('Can only unlock a locked amount tokens', async () => {
        await expect(env.connect(rankingInstance).unlock(adr.player1.wallet.address, 1, 1))
          .to.emit(env, 'TokensUnlocked')
          .withArgs(adr.player1.wallet.address, 1, 1);
        await expect(env.connect(rankingInstance).unlock(adr.player1.wallet.address, 2, 1)).to.be.revertedWith(
          'insufficient',
        );
      });
      it('Can transfer only unlocked tokens', async () => {
        await expect(
          env
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 3, '0x'),
        ).to.be.revertedWith('insufficient');
        await expect(
          env
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 2, '0x'),
        ).to.be.emit(env, 'TransferSingle');
      });
      it('Can transfer previously locked tokens', async () => {
        await env.connect(rankingInstance).unlock(adr.player1.wallet.address, 1, 1);
        await expect(
          env
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 3, '0x'),
        ).to.be.emit(env, 'TransferSingle');
      });
      it('Balance still shows same', async () => {
        expect((await env.connect(rankingInstance).balanceOf(adr.player1.wallet.address, 1)).toNumber()).to.be.equal(3);
      });
      it('Cannot lock more then balance tokens', async () => {
        await expect(
          env
            .connect(adr.player1.wallet)
            .safeTransferFrom(adr.player1.wallet.address, adr.player2.wallet.address, 1, 4, '0x'),
        ).to.be.revertedWith('insufficient');
      });
    });
  });
});
