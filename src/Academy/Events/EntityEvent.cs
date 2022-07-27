using Academy.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Events
{
    public class EntityEvent<TEntity> : INotification
        where TEntity : class
    {
        public EntityEvent(TEntity entity, EntityEventType eventType)
        {
            Entity = entity;
            EventType = eventType;
        }

        public TEntity Entity { get; }

        public EntityEventType EventType { get; }
    }
}
