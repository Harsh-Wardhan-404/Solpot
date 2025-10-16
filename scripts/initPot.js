const { AnchorProvider, Program, web3, BN } = require("@coral-xyz/anchor");
const { Connection, clusterApiUrl, Keypair } = require("@solana/web3.js");
const idl = require("../anchor/IDL/universal_pot.json");
require('dotenv').config({ path: '.env.local' });

const ACCOUNT_DISCRIMINATORS = {
  pot: [21, 239, 13, 42, 248, 174, 64, 150],
  depositorState: [66, 216, 183, 183, 211, 98, 139, 140],
};

const INSTRUCTION_DISCRIMINATORS = {
  initPot: [96, 74, 54, 30, 99, 102, 115, 37],
  deposit: [242, 35, 198, 137, 82, 225, 242, 182],
  finalize: [171, 61, 218, 56, 127, 115, 12, 217],
};

const normalizeType = (type) => {
  if (typeof type === "string") {
    return type === "publicKey" ? "pubkey" : type;
  }

  if (type && typeof type === "object") {
    if ("option" in type) {
      return { option: normalizeType(type.option) };
    }
    if ("vec" in type) {
      return { vec: normalizeType(type.vec) };
    }
    if ("array" in type) {
      const [arrayType, arrayLength] = type.array || [];
      return { array: [normalizeType(arrayType), arrayLength] };
    }
    if ("defined" in type) {
      const defined = type.defined;
      if (defined && typeof defined === "object") {
        const generics = Array.isArray(defined.generics)
          ? defined.generics.map((generic) =>
              generic?.kind === "type"
                ? { ...generic, type: normalizeType(generic.type) }
                : generic,
            )
          : undefined;

        return {
          defined: {
            ...defined,
            generics,
          },
        };
      }

      return { defined };
    }
  }

  return type;
};

const normalizeFields = (fields) => {
  if (!Array.isArray(fields)) {
    return fields;
  }

  return fields.map((field) => {
    if (field && typeof field === "object" && "type" in field) {
      return {
        ...field,
        type: normalizeType(field.type),
      };
    }

    return normalizeType(field);
  });
};

const normalizeTypeDef = (typeDef) => {
  if (!typeDef || typeof typeDef !== "object") {
    return typeDef;
  }

  if (typeDef.kind === "struct") {
    return {
      ...typeDef,
      fields: normalizeFields(typeDef.fields),
    };
  }

  if (typeDef.kind === "enum") {
    const variants = Array.isArray(typeDef.variants)
      ? typeDef.variants.map((variant) => ({
          ...variant,
          fields: normalizeFields(variant.fields),
        }))
      : typeDef.variants;

    return {
      ...typeDef,
      variants,
    };
  }

  if (typeDef.kind === "type") {
    return {
      ...typeDef,
      alias: normalizeType(typeDef.alias),
    };
  }

  return typeDef;
};

function randomCapacityLamports() {
  const min = Number(process.env.MYSTERY_MIN_CAP_SOL ?? 1);
  const max = Number(process.env.MYSTERY_MAX_CAP_SOL ?? 3);
  const step = Number(process.env.MYSTERY_STEP_SOL ?? 0.1);

  const steps = Math.max(1, Math.floor((max - min) / step + 0.0000001));
  const k = Math.floor(Math.random() * (steps + 1));
  const capSol = Number((min + k * step).toFixed(6));
  return new BN(Math.floor(capSol * 1e9)); // lamports
}

const prepareIdl = (rawIdl, programId) => {
  const idlCopy = JSON.parse(JSON.stringify(rawIdl ?? {}));
  const programAddress = programId.toBase58();

  idlCopy.address = programAddress;
  idlCopy.metadata = { ...(idlCopy.metadata ?? {}), address: programAddress };

  const accounts = Array.isArray(idlCopy.accounts) ? idlCopy.accounts : [];
  const types = Array.isArray(idlCopy.types)
    ? idlCopy.types.map((typeDef) => ({
        ...typeDef,
        type: normalizeTypeDef(typeDef.type),
      }))
    : [];
  const typeNames = new Set(types.map((typeDef) => typeDef.name));

  accounts.forEach((account) => {
    const normalizedAccountType = normalizeTypeDef(account.type);
    account.type = normalizedAccountType;

    if (!typeNames.has(account.name) && account.type) {
      types.push({
        name: account.name,
        type: JSON.parse(JSON.stringify(normalizedAccountType)),
      });
      typeNames.add(account.name);
    }

    if (!account.discriminator) {
      const knownDiscriminator = ACCOUNT_DISCRIMINATORS[account.name];
      if (knownDiscriminator) {
        account.discriminator = knownDiscriminator;
      }
    }
  });

  idlCopy.types = types;
  idlCopy.accounts = accounts;

  const instructions = Array.isArray(idlCopy.instructions) ? idlCopy.instructions : [];
  instructions.forEach((instruction) => {
    if (Array.isArray(instruction.args)) {
      instruction.args = instruction.args.map((arg) => ({
        ...arg,
        type: normalizeType(arg.type),
      }));
    }

    if (!instruction.discriminator) {
      const knownDiscriminator = INSTRUCTION_DISCRIMINATORS[instruction.name];
      if (knownDiscriminator) {
        instruction.discriminator = knownDiscriminator;
      }
    }
  });

  idlCopy.instructions = instructions;

  return idlCopy;
};

async function main() {
  console.log("NEXT_PUBLIC_PROGRAM_ID", process.env.NEXT_PUBLIC_PROGRAM_ID);
  console.log("NEXT_PUBLIC_SOLANA_RPC_URL", process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
  
  const PROGRAM_ID = new web3.PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "processed"
  );

  // Use your CLI keypair as payer/authority
  const secret = JSON.parse(require("fs").readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const provider = new AnchorProvider(
    connection,
    {
      publicKey: payer.publicKey,
      signTransaction: async (tx) => { 
        tx.partialSign(payer); 
        return tx; 
      },
      signAllTransactions: async (txs) => 
        txs.map((tx) => { 
          tx.partialSign(payer); 
          return tx; 
        }),
    },
    { preflightCommitment: "processed" }
  );

  const program = new Program(prepareIdl(idl, PROGRAM_ID), provider);
  const [potPda] = web3.PublicKey.findProgramAddressSync([Buffer.from("pot")], PROGRAM_ID);

  const deadlineTs = new BN(Math.floor(Date.now() / 1000) + 24 * 60 * 60); // +24h
  const feeBps = 500;                                         // 5%
  const cooldownSecs = 5;                                     // 5s

  console.log("Initializing pot on devnet…");
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Pot PDA:", potPda.toBase58());
  
  try {
    const capacityLamports = randomCapacityLamports();
    await program.methods
      .initPot(capacityLamports, deadlineTs, feeBps, cooldownSecs)
      .accounts({
        authority: payer.publicKey,
        pot: potPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Pot initialized successfully!");
    console.log("Pot address:", potPda.toBase58());
  } catch (error) {
    console.error("❌ Error initializing pot:", error);
  }
}

main().catch((e) => { 
  console.error("Script failed:", e); 
  process.exit(1); 
});
