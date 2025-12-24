'use client'

interface AddressHistoryProps {
  addresses: string[]
  onSelectAddress: (address: string) => void
  onClearHistory: () => void
}

export default function AddressHistory({
  addresses,
  onSelectAddress,
  onClearHistory,
}: AddressHistoryProps) {
  if (addresses.length === 0) {
    return null
  }

  return (
    <div style={{
      marginTop: '1rem',
      marginLeft: 0,
      marginRight: 0,
      padding: '1rem',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      border: '1px solid #ddd',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Recent Addresses
        </h3>
        <button
          type="button"
          onClick={onClearHistory}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {addresses.slice(0, 3).map((addr, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectAddress(addr)}
            style={{
              padding: '0.5rem',
              fontSize: '0.875rem',
              textAlign: 'left',
              backgroundColor: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff'
            }}
          >
            {addr}
          </button>
        ))}
      </div>
    </div>
  )
}


