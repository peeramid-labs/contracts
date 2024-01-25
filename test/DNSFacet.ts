import { AdrSetupResult, EnvSetupResult, SignerIdentity, setupTest } from './utils';
import { setupAddresses, setupEnvironment, getUserRegisterProps, signRegistrarMessage } from './utils';
import { getInterfaceID } from '../scripts/libraries/utils';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { IMultipass__factory } from '../types';
const path = require('path');
import { LibMultipass } from '../types/src/facets/DNSFacet';

const scriptName = path.basename(__filename);
const NEW_DOMAIN_NAME1 = 'newDomainName1';
const NEW_DOMAIN_NAME2 = 'newDomainName2';
const DEFAULT_FREE_REGISTRATIONS = ethers.BigNumber.from(3);
const NOT_ENOUGH_FEE = ethers.utils.parseEther('0.17');
const DEFAULT_FEE = ethers.utils.parseEther('2');
const FEE_AFTER_CHANGE = ethers.utils.parseEther('3');
const DEFAULT_DISCOUNT = ethers.utils.parseEther('1');
const DEFAULT_REWARD = ethers.utils.parseEther('0.5');
let adr: AdrSetupResult;

let env: EnvSetupResult;

const emptyUserQuery: LibMultipass.NameQueryStruct = {
  name: ethers.utils.formatBytes32String(''),
  id: ethers.utils.formatBytes32String(''),
  domainName: ethers.utils.formatBytes32String(''),
  wallet: ethers.constants.AddressZero,
  targetDomain: ethers.utils.formatBytes32String(''),
};

describe(scriptName, () => {
  beforeEach(async () => {
    const setup = await setupTest();
    adr = setup.adr;
    env = setup.env;
  });
  it('Is Owned by contract owner', async () => {
    expect(await env.multipass.owner()).to.be.equal(adr.multipassOwner.wallet.address);
  });
  it('Transfer ownership can be done only by contract owner', async () => {
    await expect(
      env.multipass.connect(adr.multipassOwner.wallet).transferOwnership(adr.gameCreator1.wallet.address),
    ).to.emit(env.multipass, 'OwnershipTransferred(address,address)');

    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).transferOwnership(adr.gameCreator1.wallet.address),
    ).to.revertedWith('LibDiamond: Must be contract owner');
  });
  it('Has zero domains', async () => {
    expect(await env.multipass.getContractState()).to.be.equal(0);
  });
  it('Supports multipass interface', async () => {
    const MultipassInterface = IMultipass__factory.createInterface();
    const multipassInterfaceId = getInterfaceID(MultipassInterface);
    expect(await env.multipass.supportsInterface(multipassInterfaceId._hex)).to.be.true;
  });
  it('Emits and increments when new domain initialized', async () => {
    await expect(
      await env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          1000,
          ethers.utils.parseEther('3'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('1'),
        ),
    ).to.emit(env.multipass, 'InitializedDomain');
    expect(await env.multipass.getContractState()).to.be.equal(1);
  });
  it('Reverts domain specific methods if domain does not exists', async () => {
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .activateDomain(ethers.utils.formatBytes32String('invalidDomain')),
    ).to.be.revertedWith('Domain does not exist');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .deactivateDomain(ethers.utils.formatBytes32String('invalidDomain')),
    ).to.be.revertedWith('Domain does not exist');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .changeFee(ethers.utils.formatBytes32String('invalidDomain'), '1'),
    ).to.be.revertedWith('Domain does not exist');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .changeRegistrar(ethers.utils.formatBytes32String('invalidDomain'), adr.gameCreator1.wallet.address),
    ).to.be.revertedWith('Domain does not exist');
    const invalidDomainQuery = { ...emptyUserQuery };
    invalidDomainQuery.domainName = ethers.utils.formatBytes32String('invalidDomain');
    invalidDomainQuery.targetDomain = ethers.utils.formatBytes32String('invalidDomain');

    const registrarMessage = {
      name: ethers.utils.formatBytes32String(adr.player1.name),
      id: ethers.utils.formatBytes32String(adr.player1.id),
      domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
      deadline: ethers.BigNumber.from(9999),
      nonce: ethers.BigNumber.from(0),
    };

    const registarSignature = await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1);

    await expect(env.multipass.connect(adr.multipassOwner.wallet).deleteName(invalidDomainQuery)).to.be.revertedWith(
      'Domain does not exist',
    );

    let applicantData: LibMultipass.RecordStruct = {
      name: ethers.utils.formatBytes32String(adr.player1.name),
      id: ethers.utils.formatBytes32String(adr.player1.id),
      wallet: adr.player1.wallet.address,
      nonce: 0,
      domainName: ethers.utils.formatBytes32String('invalidDomain'),
    };

    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .register(
          applicantData,
          ethers.utils.formatBytes32String('invalidDomain'),
          registarSignature,
          registrarMessage.deadline,
          emptyUserQuery,
          ethers.constants.HashZero,
        ),
    ).to.be.revertedWith('Domain does not exist');
  });
  it('Reverts if intializing domain name props are wrong', async () => {
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          DEFAULT_FREE_REGISTRATIONS,
          ethers.utils.parseEther('3'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.utils.parseEther('1.0001'),
          ethers.utils.parseEther('2'),
        ),
    ).to.be.revertedWith('Multipass->initializeDomain: referral values are higher then fee itself');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          ethers.constants.AddressZero,
          1000,
          ethers.utils.parseEther('3'),
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.utils.parseEther('1.0001'),
          ethers.utils.parseEther('2'),
        ),
    ).to.be.revertedWith('Multipass->initializeDomain: You must provide a registrar address');
    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          1000,
          ethers.utils.parseEther('3'),
          ethers.utils.formatBytes32String(''),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('2'),
        ),
    ).to.be.revertedWith('Multipass->initializeDomain: Domain name cannot be empty');

    await expect(
      env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          1000,
          ethers.constants.MaxUint256,
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          ethers.constants.MaxUint256,
          ethers.utils.parseEther('1'),
        ),
    ).to.be.revertedWith('Multipass->initializeDomain: referrerReward + referralDiscount overflow');
  });
  it('Reverts any ownerOnly call by not an owner', async () => {
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).withrawFunds(adr.maliciousActor1.wallet.address),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
    await expect(
      env.multipass
        .connect(adr.maliciousActor1.wallet)
        .changeReferralProgram(
          DEFAULT_REWARD,
          DEFAULT_FREE_REGISTRATIONS,
          DEFAULT_DISCOUNT,
          ethers.utils.formatBytes32String(''),
        ),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
    await expect(env.multipass.connect(adr.maliciousActor1.wallet).deleteName(emptyUserQuery)).to.be.revertedWith(
      'LibDiamond: Must be contract owner',
    );
    await expect(
      env.multipass
        .connect(adr.maliciousActor1.wallet)
        .changeRegistrar(ethers.utils.formatBytes32String(''), adr.maliciousActor1.wallet.address),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).changeFee(ethers.utils.formatBytes32String(''), DEFAULT_FEE),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).activateDomain(ethers.utils.formatBytes32String('')),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
    await expect(
      env.multipass.connect(adr.maliciousActor1.wallet).deactivateDomain(ethers.utils.formatBytes32String('')),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
    await expect(
      env.multipass
        .connect(adr.maliciousActor1.wallet)
        .initializeDomain(
          adr.maliciousActor1.wallet.address,
          DEFAULT_FREE_REGISTRATIONS,
          DEFAULT_FEE,
          ethers.utils.formatBytes32String(''),
          DEFAULT_REWARD,
          DEFAULT_DISCOUNT,
        ),
    ).to.be.revertedWith('LibDiamond: Must be contract owner');
  });
  describe('When a new domain was initialized', () => {
    let numDomains = 0;
    beforeEach(async () => {
      await env.multipass
        .connect(adr.multipassOwner.wallet)
        .initializeDomain(
          adr.registrar1.wallet.address,
          DEFAULT_FREE_REGISTRATIONS,
          DEFAULT_FEE,
          ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          DEFAULT_REWARD,
          DEFAULT_DISCOUNT,
        );
      numDomains = 1;
    });
    it('Reverts if domain name already registered', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .initializeDomain(
            adr.registrar1.wallet.address,
            DEFAULT_FREE_REGISTRATIONS,
            DEFAULT_FEE,
            ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            DEFAULT_REWARD,
            DEFAULT_DISCOUNT,
          ),
      ).to.be.revertedWith('Multipass->initializeDomain: Domain name already exists');
    });
    it('Domain name state is equal to initial values and is not active', async () => {
      const resp = await env.multipass.getDomainState(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
      // expect(ethers.utils.parseBytes32String(resp)).to.be.equal(
      //   NEW_DOMAIN_NAME1
      // );
      expect(ethers.utils.parseBytes32String(resp['name'])).to.be.equal(NEW_DOMAIN_NAME1);
      expect(resp['fee']).to.be.equal(DEFAULT_FEE);
      expect(resp['freeRegistrationsNumber']).to.be.equal(DEFAULT_FREE_REGISTRATIONS);
      expect(resp['referrerReward']).to.be.equal(DEFAULT_REWARD);
      expect(resp['referralDiscount']).to.be.equal(DEFAULT_DISCOUNT);
      expect(resp['isActive']).to.be.equal(false);
      expect(resp['registrar']).to.be.equal(adr.registrar1.wallet.address);
      expect(resp['ttl']).to.be.equal(0);
      expect(resp['registerSize'].toString()).to.be.equal('0');
    });
    it('Incremented number of domains', async () => {
      expect(await env.multipass.getContractState()).to.be.equal(numDomains);
    });
    it('emits when domain activated', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .activateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1)),
      ).to.emit(env.multipass, 'DomainActivated');
    });
    it('Does not allow to register because is not active', async () => {
      let applicantData: LibMultipass.RecordStruct = {
        name: ethers.utils.formatBytes32String(adr.player1.name),
        id: ethers.utils.formatBytes32String(adr.player1.id),
        wallet: adr.player1.wallet.address,
        nonce: 0,
        domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
      };
      await expect(
        env.multipass
          .connect(adr.player1.wallet)
          .register(
            applicantData,
            ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            ethers.constants.HashZero,
            ethers.constants.HashZero,
            emptyUserQuery,
            ethers.constants.HashZero,
          ),
      ).to.be.revertedWith('Multipass->register: domain is not active');
    });
    it('Emits and changes fee', async () => {
      await expect(
        env.multipass
          .connect(adr.multipassOwner.wallet)
          .changeFee(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1), FEE_AFTER_CHANGE),
      ).to.emit(env.multipass, 'DomainFeeChanged');

      const resp = await env.multipass
        .connect(adr.player1.wallet)
        .getDomainState(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
      expect(resp[1]).to.be.equal(FEE_AFTER_CHANGE);
    });
    describe('when domain was set to active', () => {
      beforeEach(async () => {
        await env.multipass
          .connect(adr.multipassOwner.wallet)
          .activateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
      });
      it('Is set to active', async () => {
        const resp = await env.multipass.getDomainState(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1));
        expect(resp['isActive']).to.be.true;
      });

      it('Emits on register when properties are valid', async () => {
        const registrarMessage = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          deadline: ethers.BigNumber.from(9999),
          nonce: ethers.BigNumber.from(0),
        };

        const registarSignature = await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1);

        let applicantData: LibMultipass.RecordStruct = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          wallet: adr.player1.wallet.address,
          nonce: 0,
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
        };

        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              applicantData,
              registrarMessage.domainName,
              registarSignature,
              registrarMessage.deadline,
              emptyUserQuery,
              ethers.constants.HashZero,
            ),
        ).to.emit(env.multipass, 'Registered');
      });

      it('Reverts on register if properties are invalid', async () => {
        const registrarMessage = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
          deadline: ethers.BigNumber.from(9999),
          nonce: ethers.BigNumber.from(0),
        };

        const invalidRegistrarSignature = await signRegistrarMessage(
          registrarMessage,
          env.multipass.address,
          adr.maliciousActor1,
        );

        let applicantData: LibMultipass.RecordStruct = {
          name: ethers.utils.formatBytes32String(adr.player1.name),
          id: ethers.utils.formatBytes32String(adr.player1.id),
          wallet: adr.player1.wallet.address,
          nonce: 0,
          domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
        };

        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              applicantData,
              registrarMessage.domainName,
              invalidRegistrarSignature,
              registrarMessage.deadline,
              emptyUserQuery,
              ethers.constants.HashZero,
            ),
        ).to.be.revertedWith('Multipass->register: Registrar signature is not valid');

        registrarMessage.deadline = ethers.BigNumber.from(ethers.provider.blockNumber);

        // await expect(
        //   env.multipass
        //     .connect(adr.player1.wallet)
        //     .register(
        //       applicantData,
        //       registrarMessage.domainName,
        //       await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1),
        //       registrarMessage.deadline,
        //       emptyUserQuery,
        //       ethers.constants.HashZero,
        //     ),
        // ).to.be.revertedWith('Multipass->register: Deadline is less than current block number');
      });
      it('Reverts if signature is outdated', async () => {
        const registrantProps1 = await getUserRegisterProps(
          adr.player2,
          adr.registrar1,
          NEW_DOMAIN_NAME1,
          1,
          env.multipass.address,
        );
        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              registrantProps1.applicantData,
              registrantProps1.registrarMessage.domainName,
              registrantProps1.validSignature,
              registrantProps1.registrarMessage.deadline,
              emptyUserQuery,
              ethers.constants.HashZero,
            ),
        ).to.be.revertedWith('Multipass->register: Deadline is less than current block number');
      });
      it('Allows valid registrations for free until free tier has reached', async () => {
        const size = DEFAULT_FREE_REGISTRATIONS.toNumber();
        const players = [adr.player1, adr.player2, adr.player3, adr.player4, adr.player5];
        let i = 0;
        for (i = 0; i < size; i++) {
          const regProps = await getUserRegisterProps(
            players[i],
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
          );
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                regProps.applicantData,
                regProps.registrarMessage.domainName,
                regProps.validSignature,
                regProps.registrarMessage.deadline,
                emptyUserQuery,
                ethers.constants.HashZero,
              ),
          ).to.emit(env.multipass, 'Registered');
        }
        const regProps = await getUserRegisterProps(
          players[i],
          adr.registrar1,
          NEW_DOMAIN_NAME1,
          99999,
          env.multipass.address,
        );
        await expect(
          env.multipass
            .connect(adr.player1.wallet)
            .register(
              regProps.applicantData,
              regProps.registrarMessage.domainName,
              regProps.validSignature,
              regProps.registrarMessage.deadline,
              emptyUserQuery,
              ethers.constants.HashZero,
            ),
        ).to.be.revertedWith('Multipass->register: Payment value is not enough');
      });

      describe('When user was registered', () => {
        let numDomains = 0;
        beforeEach(async () => {
          const regProps = await getUserRegisterProps(
            adr.player1,
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
          );

          await env.multipass
            .connect(adr.player1.wallet)
            .register(
              regProps.applicantData,
              regProps.registrarMessage.domainName,
              regProps.validSignature,
              regProps.registrarMessage.deadline,
              emptyUserQuery,
              ethers.constants.HashZero,
            );
        });
        it('Can find newly registered user ', async () => {
          //By full query
          let query: LibMultipass.NameQueryStruct = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          let resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With id and address
          query = {
            name: ethers.utils.formatBytes32String(''),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With only id
          query = {
            name: ethers.utils.formatBytes32String(''),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: ethers.constants.AddressZero,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With only address
          query = {
            name: ethers.utils.formatBytes32String(''),
            id: ethers.utils.formatBytes32String(''),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;

          //With only name
          query = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: ethers.utils.formatBytes32String(''),
            wallet: ethers.constants.AddressZero,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.true;
        });
        it('Reverts registration if user id already exist', async () => {
          const regProps = await getUserRegisterProps(
            adr.player1,
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
          );
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                regProps.applicantData,
                regProps.registrarMessage.domainName,
                regProps.validSignature,
                regProps.registrarMessage.deadline,
                emptyUserQuery,
                ethers.constants.HashZero,
              ),
          ).to.be.revertedWith('User already registered, use modify instead');
          regProps.applicantData.id = ethers.utils.formatBytes32String(adr.player2.id);
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                regProps.applicantData,
                regProps.registrarMessage.domainName,
                regProps.validSignature,
                regProps.registrarMessage.deadline,
                emptyUserQuery,
                ethers.constants.HashZero,
              ),
          ).to.be.revertedWith('User already registered, use modify instead');
          regProps.applicantData.name = ethers.utils.formatBytes32String(adr.player2.name);
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                regProps.applicantData,
                regProps.registrarMessage.domainName,
                regProps.validSignature,
                regProps.registrarMessage.deadline,
                emptyUserQuery,
                ethers.constants.HashZero,
              ),
          ).to.be.revertedWith('User already registered, use modify instead');
        });
        it('Emits when register with valid referral code', async () => {
          const registrantProps = await getUserRegisterProps(
            adr.player2,
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
            adr.player1,
          );
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                registrantProps.applicantData,
                registrantProps.registrarMessage.domainName,
                registrantProps.validSignature,
                registrantProps.registrarMessage.deadline,
                registrantProps.referrerData,
                registrantProps.referrerSignature,
              ),
          ).to.emit(env.multipass, 'Referred');
        });
        it('Can modify username with a valid arguments', async () => {
          const registrarMessage = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1 + `new`),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            deadline: ethers.BigNumber.from(99999),
            nonce: ethers.BigNumber.from(1),
          };

          const modifyQuery: LibMultipass.NameQueryStruct = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: registrarMessage.id,
            domainName: registrarMessage.domainName,
            wallet: adr.player1.wallet.address,
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          const validSignature = await signRegistrarMessage(registrarMessage, env.multipass.address, adr.registrar1);

          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .modifyUserName(
                registrarMessage.domainName,
                modifyQuery,
                registrarMessage.name,
                validSignature,
                registrarMessage.deadline,
              ),
          ).to.be.revertedWith('Multipass->modifyUserName: Not enough payment');

          const valueToPay = env.multipass.getModifyPrice(modifyQuery);
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .modifyUserName(
                registrarMessage.domainName,
                modifyQuery,
                registrarMessage.name,
                validSignature,
                registrarMessage.deadline,
                { value: valueToPay },
              ),
          ).to.be.emit(env.multipass, 'UserRecordModified');
        });
        it('Emits and deletes user', async () => {
          let query: LibMultipass.NameQueryStruct = {
            name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME1),
            id: ethers.utils.formatBytes32String(adr.player1.id + `.` + NEW_DOMAIN_NAME1),
            wallet: adr.player1.wallet.address,
            domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            targetDomain: ethers.utils.formatBytes32String(''),
          };

          await expect(env.multipass.connect(adr.multipassOwner.wallet).deleteName(query)).to.emit(
            env.multipass,
            'nameDeleted',
          );

          let resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(query);
          expect(resp[0]).to.be.false;
        });
        describe('When second domain is initialized and active', () => {
          beforeEach(async () => {
            await env.multipass
              .connect(adr.multipassOwner.wallet)
              .initializeDomain(
                adr.registrar1.wallet.address,
                DEFAULT_FREE_REGISTRATIONS,
                DEFAULT_FEE,
                ethers.utils.formatBytes32String(NEW_DOMAIN_NAME2),
                DEFAULT_REWARD,
                DEFAULT_DISCOUNT,
              );
            await env.multipass
              .connect(adr.multipassOwner.wallet)
              .activateDomain(ethers.utils.formatBytes32String(NEW_DOMAIN_NAME2));
          });
          it('Reverts on referring yourself from a different domain', async () => {
            const registrantProps1 = await getUserRegisterProps(
              adr.player2,
              adr.registrar1,
              NEW_DOMAIN_NAME1,
              99999,
              env.multipass.address,
            );
            await env.multipass
              .connect(adr.player2.wallet)
              .register(
                registrantProps1.applicantData,
                registrantProps1.registrarMessage.domainName,
                registrantProps1.validSignature,
                registrantProps1.registrarMessage.deadline,
                registrantProps1.referrerData,
                registrantProps1.referrerSignature,
              );
            const registrantProps2 = await getUserRegisterProps(
              adr.player2,
              adr.registrar1,
              NEW_DOMAIN_NAME2,
              99999,
              env.multipass.address,
              adr.player2,
              NEW_DOMAIN_NAME1,
            );
            const registrantProps21 = await getUserRegisterProps(
              adr.player2,
              adr.registrar1,
              NEW_DOMAIN_NAME1,
              99999,
              env.multipass.address,
              adr.player2,
            );
            await expect(
              env.multipass
                .connect(adr.player2.wallet)
                .register(
                  registrantProps2.applicantData,
                  registrantProps2.registrarMessage.domainName,
                  registrantProps2.validSignature,
                  registrantProps2.registrarMessage.deadline,
                  registrantProps21.referrerData,
                  registrantProps2.referrerSignature,
                ),
            ).to.revertedWith('Cannot refer yourself');
          });

          it('Can register same user on both domains and do cross domain lookup', async () => {
            const registrantProps1 = await getUserRegisterProps(
              adr.player1,
              adr.registrar1,
              NEW_DOMAIN_NAME2,
              99999,
              env.multipass.address,
            );
            await expect(
              env.multipass
                .connect(adr.player1.wallet)
                .register(
                  registrantProps1.applicantData,
                  registrantProps1.registrarMessage.domainName,
                  registrantProps1.validSignature,
                  registrantProps1.registrarMessage.deadline,
                  registrantProps1.referrerData,
                  registrantProps1.referrerSignature,
                ),
            ).to.emit(env.multipass, 'Registered');

            const crossDomainQuery: LibMultipass.NameQueryStruct = {
              name: ethers.utils.formatBytes32String(adr.player1.name + `.` + NEW_DOMAIN_NAME2),
              id: ethers.utils.formatBytes32String(''),
              domainName: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME2),
              wallet: ethers.constants.AddressZero,
              targetDomain: ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            };
            const resp = await env.multipass.connect(adr.player1.wallet).resolveRecord(crossDomainQuery);
            expect(resp[0]).to.be.true;
            expect(ethers.utils.parseBytes32String(resp[1][1])).to.be.equal(adr.player1.name + `.` + NEW_DOMAIN_NAME1);
          });
        });
      });
      describe('When free number of free registrations has been reached', () => {
        beforeEach(async () => {
          await env.multipass
            .connect(adr.multipassOwner.wallet)
            .changeReferralProgram(
              DEFAULT_REWARD,
              0,
              DEFAULT_DISCOUNT,
              ethers.utils.formatBytes32String(NEW_DOMAIN_NAME1),
            );
        });
        it('Should allow registering with paying ether', async () => {
          const registrantProps1 = await getUserRegisterProps(
            adr.player1,
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
          );
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                registrantProps1.applicantData,
                registrantProps1.registrarMessage.domainName,
                registrantProps1.validSignature,
                registrantProps1.registrarMessage.deadline,
                registrantProps1.referrerData,
                registrantProps1.referrerSignature,
                { value: DEFAULT_FEE },
              ),
          ).to.emit(env.multipass, 'Registered');
        });
        it('Should be able withraw ammount payed', async () => {
          const registrantProps1 = await getUserRegisterProps(
            adr.player1,
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
          );
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                registrantProps1.applicantData,
                registrantProps1.registrarMessage.domainName,
                registrantProps1.validSignature,
                registrantProps1.registrarMessage.deadline,
                registrantProps1.referrerData,
                registrantProps1.referrerSignature,
                { value: DEFAULT_FEE },
              ),
          ).to.emit(env.multipass, 'Registered');
          await expect(
            await env.multipass.connect(adr.multipassOwner.wallet).withrawFunds(adr.multipassOwner.wallet.address),
          ).to.changeEtherBalance(adr.multipassOwner.wallet, DEFAULT_FEE);
        });
        it('Should revert register if not enough ether', async () => {
          const registrantProps1 = await getUserRegisterProps(
            adr.player1,
            adr.registrar1,
            NEW_DOMAIN_NAME1,
            99999,
            env.multipass.address,
          );
          await expect(
            env.multipass
              .connect(adr.player1.wallet)
              .register(
                registrantProps1.applicantData,
                registrantProps1.registrarMessage.domainName,
                registrantProps1.validSignature,
                registrantProps1.registrarMessage.deadline,
                registrantProps1.referrerData,
                registrantProps1.referrerSignature,
                { value: NOT_ENOUGH_FEE },
              ),
          ).to.be.revertedWith('Multipass->register: Payment value is not enough');
        });
      });
    });
  });
});
