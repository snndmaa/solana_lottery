use anchor_lang::{
    prelude::*,
    solana_program::{clock::Clock, hash::Hash, program::invoke, system_instruction::transfer},
};

mod constants;

use crate::constants::*;

declare_id!("3BG3Ymop2mWUyd3twAnb42y57WvbFQ6xGuua7TVvDU6K");

#[program]
mod lottery {
    use super::*;   // Getting our previously specified imports as is

    pub fn init_master(_ctx: Context<InitMaster>) -> Result<()> {
        // An object that holds last lottery id
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitMaster<'info> {
    #[account(
        init,
        payer = payer,
        space = 4 + 8,  // 4 is space master/last_id takes being u32 and the 8 is the account discriminator(filler space)
        seeds = [MASTER_SEED.as_bytes()],
        bump,
    )]
    pub master: Account<'info, Master>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Master {
    pub last_id: u32,   // u32 typically takes 4 bytes
}