import { useState, useEffect } from 'react'
import { DrivingTelemetry } from './Car'

interface HUDProps {
  currentAdUrl: string | null
  telemetry: DrivingTelemetry
  onHide: () => void
  isBidding: boolean
  setIsBidding: (val: boolean) => void
  onBidSubmit: (prompt: string, bidAmount: string) => Promise<void>
  isSubmitting: boolean
  lastPrompt: string
  lastBidAmount: string
}

function money(value?: number) {
  return `$${Number(value ?? 0).toFixed(3)}`
}

function ControlButton({ label, inputKey }: { label: string, inputKey: string }) {
  // In the original, this dispatched events. For visual parity we just render the button.
  return (
    <button className="control-button" type="button">
      {label}
    </button>
  )
}

export default function HUD({ 
  currentAdUrl, 
  telemetry, 
  onHide,
  isBidding,
  setIsBidding,
  onBidSubmit,
  isSubmitting,
  lastPrompt,
  lastBidAmount
}: HUDProps) {

  const [prompt, setPrompt] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    onBidSubmit(prompt, bidAmount);
  };

  return (
    <div className="hud">
      <section className="hud-panel campaign-panel">
        <div className="campaign-topline">
          <span>arcad drive</span>
          <button className="ghost-button" onClick={onHide} type="button">H hide</button>
        </div>
        <div className="campaign-card">
          <div className="campaign-label">last billboard winner</div>
          <div className="campaign-row">
            <div className="campaign-copy">
              <h1>{lastPrompt ? "Local User" : 'No winner yet'}</h1>
              <p>{lastPrompt ? lastPrompt : 'Background agents are bidding. The winning prompt and rendered billboard image will appear here after the first round closes.'}</p>
            </div>
            <div className="campaign-price">{lastPrompt ? money(parseFloat(lastBidAmount)) : 'pending'}</div>
          </div>
          <div className="render-preview">
            {currentAdUrl ? <img src={currentAdUrl} alt="" /> : <div className="render-placeholder" />}
            <div>
              <span>winning image</span>
              <strong>{currentAdUrl ? 'rendered from ad server' : 'waiting for generated render'}</strong>
            </div>
          </div>
        </div>
        <div className="metric-strip">
          <div>
            <span>Speed</span>
            <strong>{Math.round(telemetry.speed * 1.7)} mph</strong>
          </div>
          <div>
            <span>Steer</span>
            <strong>{telemetry.steering > 0.08 ? 'right' : telemetry.steering < -0.08 ? 'left' : 'center'}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>local demo</strong>
          </div>
        </div>
        <div className="leader-strip">
          <span>live leader</span>
          <strong>{lastPrompt ? `Local User ${money(parseFloat(lastBidAmount))}` : 'waiting for bids'}</strong>
        </div>
      </section>

      <section className="hud-panel round-panel" style={{ display: isBidding ? 'block' : 'none', background: 'rgba(24, 31, 31, 0.95)', border: '1px solid #edbf67' }}>
        <div className="action-head" style={{ marginBottom: 16 }}>
          <span style={{ color: '#edbf67' }}>Submit Bid</span>
          <strong>active</strong>
        </div>
        <form onSubmit={handleBid} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           <div>
              <label style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255, 245, 221, 0.68)', marginBottom: 4 }}>Ad Prompt</label>
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A neon cyberpunk sneaker" 
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 6, color: '#fff' }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255, 245, 221, 0.68)', marginBottom: 4 }}>Bid Amount (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: 8, color: 'rgba(255, 255, 255, 0.4)' }}>$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.00" 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px 8px 24px', borderRadius: 6, color: '#fff' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="hud-button primary"
              style={{ marginTop: 8 }}
            >
              {isSubmitting ? "Generating..." : "Place Bid & Generate"}
            </button>
            <button 
              type="button" 
              onClick={() => setIsBidding(false)}
              className="hud-button"
            >
              Cancel
            </button>
        </form>
      </section>

      {!isBidding && (
        <section className="hud-panel round-panel">
          <div className="action-head">
            <span>round stats</span>
            <strong>syncing</strong>
          </div>
          <div className="round-timer">
            <span>time left</span>
            <strong>--:--</strong>
          </div>
          <div className="round-stat-grid">
            <div>
              <span>current bids</span>
              <strong>{lastPrompt ? 1 : 0}</strong>
            </div>
            <div>
              <span>leader</span>
              <strong>{lastPrompt ? `Local User ${money(parseFloat(lastBidAmount))}` : 'none'}</strong>
            </div>
            <div>
              <span>last winner</span>
              <strong>none</strong>
            </div>
            <div>
              <span>last render</span>
              <strong>pending</strong>
            </div>
          </div>
        </section>
      )}

      <section className="hud-panel drive-panel">
        <div className="drive-panel-head">
          <span>drive</span>
          <strong>WASD / arrows</strong>
        </div>
        <div className="control-grid" aria-label="Driving controls">
          <ControlButton label="W" inputKey="accelerate" />
          <div className="steer-pair">
            <ControlButton label="A" inputKey="steerLeft" />
            <ControlButton label="D" inputKey="steerRight" />
          </div>
          <ControlButton label="S" inputKey="brake" />
        </div>
      </section>

      <section className="hud-panel scene-panel">
        <div className="scene-head">
          <span>scene</span>
          <strong>meadow</strong>
        </div>
        <div className="scene-tabs" aria-label="Scene">
          {['meadow', 'alpine', 'snow', 'autumn', 'coast', 'desert', 'dusk'].map((option) => (
            <button
              key={option}
              className={option === 'meadow' ? 'scene-tab active' : 'scene-tab'}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="car-tabs" aria-label="Car">
          <button className={'car-tab active'} type="button">SEDAN</button>
          <button className={'car-tab'} type="button">SUV</button>
        </div>
      </section>

      <section className="hud-panel bid-panel">
        <div className="strip-head">
          <span>Bids by round</span>
          <span>0 rounds</span>
        </div>
        <div className="round-list">
          <div className="empty-row">waiting for agents</div>
        </div>
      </section>
    </div>
  )
}
