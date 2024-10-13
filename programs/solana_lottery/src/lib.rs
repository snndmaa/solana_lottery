use anchor_lang::{
    prelude::*,
    solana_program::{clock::Clock, hash::Hash, program::invoke, system_instruction::transfer},
};

mod constants;

use crate::constants::*;

declare_id!("3BG3Ymop2mWUyd3twAnb42y57WvbFQ6xGuua7TVvDU6K");

#[program]
mod lottery {
    use instruction::BuyTicket;

    use super::*;   // Getting our previously specified imports as is

    pub fn init_master(_ctx: Context<InitMaster>) -> Result<()> {
        // An object that holds last lottery id
        Ok(())
    }

    pub fn create_lottery(ctx: Context<CreateLottery>, ticket_price: u64,) -> Result<()> {
        // Creates a lottery account which holds the id, winning address, ticket cost, if prize has been claimed and who has authority over the lottery
        let lottery: &mut Account<'_, Lottery> = &mut ctx.accounts.lottery;
        let master: &mut Account<'_, Master> = &mut ctx.accounts.master;

        // Increment last ticket id
        master.last_id += 1;

        // Set lottery values
        lottery.id = master.last_id;
        lottery.authority = ctx.accounts.authority.key();
        lottery.ticket_price = ticket_price;

        msg!("Created Lottery: {}", lottery.id);
        msg!("Authority: {}", lottery.authority);
        msg!("Ticket Price: {}", lottery.ticket_price);

        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>, lottery_id: u32) -> Result<()> {

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

#[derive(Accounts)]
pub struct CreateLottery<'info> {
    #[account(
        init,
        payer = authority,
        space = 4 + 32 + 4 + 1 + 4 + 1 + 8, // This is based on the types defined in the lottery struct and how much space they actually take
        seeds = [LOTTERY_SEED.as_bytes(), &(master.last_id + 1).to_le_bytes()],
        bump,
    )]
    pub lottery: Account<'info, Lottery>,

    #[account(
        mut,
        seeds = [MASTER_SEED.as_bytes()],
        bump,
    )]
    pub master: Account<'info, Master>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(lottery_id: u32)]
pub struct BuyTicket<'info> {
    
}


#[account]
pub struct Master {
    pub last_id: u32,   // u32 typically takes 4 bytes
}

#[account]
pub struct Lottery {
    pub id: u32,
    pub authority: Pubkey,
    pub ticket_price: u64,
    pub last_ticket_id: u32,
    pub winner_id: Option<u32>,
    pub claimed: bool, 
}